use std::path::PathBuf;
use std::process::Stdio;
use tauri::AppHandle;
use tauri::Manager;
use tokio::process::Command;
use tokio::time::{sleep, Duration};

const API_STARTUP_WAIT_SECS: u64 = 3;
const API_PORT: u16 = 7300;
const API_HEALTH_RETRIES: u32 = 15;
const API_HEALTH_RETRY_INTERVAL_SECS: u64 = 2;
const API_RESTART_DELAY_SECS: u64 = 1;
const ENCRYPTION_KEY_BYTES: usize = 32;
const CONFIG_FILE_NAME: &str = "app-config.json";
const NGROK_RESTART_DELAY_SECS: u64 = 3;

fn resolve_apps_root(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        // Dev: project root is parent of src-tauri (CARGO_MANIFEST_DIR)
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("project root not found")
            .to_path_buf()
    } else {
        // Production: bundled resources directory
        app.path()
            .resource_dir()
            .expect("resource dir not found")
    }
}

fn resolve_node() -> String {
    which::which("node")
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "node".to_string())
}

fn resolve_ngrok() -> Option<String> {
    which::which("ngrok").map(|p| p.to_string_lossy().to_string()).ok()
}

// Lê ngrokEnabled do app-config.json. Default false quando o arquivo não existe
// ou o campo está ausente — o túnel só sobe quando explicitamente habilitado.
fn is_ngrok_enabled(config_path: &PathBuf) -> bool {
    let content = match std::fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(_) => return false,
    };
    serde_json::from_str::<serde_json::Value>(&content)
        .ok()
        .and_then(|v| v.get("ngrokEnabled").and_then(|n| n.as_bool()))
        .unwrap_or(false)
}

// Mantém um túnel ngrok apontando pra API (porta 7300). A URL pública fica
// disponível na API local do ngrok em http://127.0.0.1:4040/api/tunnels, que o
// endpoint /setup/webhook/ngrok consulta. Reinicia o túnel se cair.
async fn start_ngrok(ngrok: String) {
    loop {
        let mut cmd = Command::new(&ngrok);
        cmd.arg("http")
            .arg(API_PORT.to_string())
            .arg("--log=stdout")
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        match cmd.spawn() {
            Ok(mut child) => {
                println!("[sidecar] ngrok started (pid={})", child.id().unwrap_or(0));
                let _ = child.wait().await;
                eprintln!("[sidecar] ngrok exited — restarting");
            }
            Err(e) => eprintln!("[sidecar] Failed to start ngrok: {}", e),
        }
        sleep(Duration::from_secs(NGROK_RESTART_DELAY_SECS)).await;
    }
}

async fn wait_for_api() -> bool {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/", API_PORT);
    for _ in 0..API_HEALTH_RETRIES {
        if client.get(&url).send().await.is_ok() {
            return true;
        }
        sleep(Duration::from_secs(API_HEALTH_RETRY_INTERVAL_SECS)).await;
    }
    false
}

fn load_env_file(path: &PathBuf) -> Vec<(String, String)> {
    let content = std::fs::read_to_string(path).unwrap_or_default();
    content
        .lines()
        .filter(|l| !l.starts_with('#') && l.contains('='))
        .filter_map(|l| {
            let mut parts = l.splitn(2, '=');
            let key = parts.next()?.trim().to_string();
            let val = parts.next()?.trim().trim_matches('"').to_string();
            Some((key, val))
        })
        .collect()
}

fn resolve_entry(apps_root: &PathBuf, sub: &str, entry_in_dist: &str, entry_in_bundle: &str) -> PathBuf {
    let dist_entry = apps_root.join(sub).join("dist").join(entry_in_dist);
    if dist_entry.exists() {
        return dist_entry;
    }
    apps_root.join(sub).join("bundle").join(entry_in_bundle)
}

fn resolve_config_path(app: &AppHandle, api_dir: &PathBuf) -> PathBuf {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join(CONFIG_FILE_NAME))
        .unwrap_or_else(|_| api_dir.join(CONFIG_FILE_NAME))
}

fn generate_encryption_key() -> String {
    let mut bytes = std::fs::read("/dev/urandom").unwrap_or_default();
    bytes.truncate(ENCRYPTION_KEY_BYTES);
    while bytes.len() < ENCRYPTION_KEY_BYTES {
        bytes.push(0);
    }
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn ensure_encryption_key(env_file: &PathBuf) {
    let content = std::fs::read_to_string(env_file).unwrap_or_default();
    if content.lines().any(|l| l.trim_start().starts_with("ENCRYPTION_KEY=")) {
        return;
    }
    let key = generate_encryption_key();
    let mut next = content.clone();
    if !next.is_empty() && !next.ends_with('\n') {
        next.push('\n');
    }
    next.push_str(&format!("ENCRYPTION_KEY={}\n", key));
    if let Err(e) = std::fs::write(env_file, next) {
        eprintln!("[sidecar] Failed to write ENCRYPTION_KEY: {}", e);
    } else {
        println!("[sidecar] ENCRYPTION_KEY generated (first launch)");
    }
}

pub async fn start_services(app: &AppHandle) {
    let apps_root = resolve_apps_root(app);
    let node = resolve_node();
    let api_dir = apps_root.join("apps/api");
    let env_file = api_dir.join(".env");
    let config_path = resolve_config_path(app, &api_dir);

    if let Some(parent) = config_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    ensure_encryption_key(&env_file);

    if is_ngrok_enabled(&config_path) {
        match resolve_ngrok() {
            Some(ngrok) => {
                tokio::spawn(start_ngrok(ngrok));
            }
            None => eprintln!("[sidecar] ngrok não encontrado — webhook via ngrok indisponível"),
        }
    } else {
        println!("[sidecar] ngrok desabilitado nas configurações");
    }

    loop {
        run_api_once(&node, &apps_root, &api_dir, &env_file, &config_path).await;
        eprintln!("[sidecar] API process exited — restarting");
        sleep(Duration::from_secs(API_RESTART_DELAY_SECS)).await;
    }
}

async fn run_api_once(
    node: &str,
    apps_root: &PathBuf,
    api_dir: &PathBuf,
    env_file: &PathBuf,
    config_path: &PathBuf,
) {
    let entry = resolve_entry(apps_root, "apps/api", "index.js", "index.js");
    if !entry.exists() {
        eprintln!("[sidecar] API entry not found: {}", entry.display());
        sleep(Duration::from_secs(API_RESTART_DELAY_SECS)).await;
        return;
    }

    let env_vars = load_env_file(env_file);

    let mut cmd = Command::new(node);
    cmd.arg(&entry)
        .current_dir(api_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .env("APP_CONFIG_PATH", config_path)
        .envs(env_vars);

    match cmd.spawn() {
        Ok(mut child) => {
            println!("[sidecar] API started (pid={})", child.id().unwrap_or(0));
            sleep(Duration::from_secs(API_STARTUP_WAIT_SECS)).await;
            if wait_for_api().await {
                println!("[sidecar] API healthy on port {}", API_PORT);
            } else {
                eprintln!("[sidecar] API did not respond after startup");
            }
            let _ = child.wait().await;
        }
        Err(e) => {
            eprintln!("[sidecar] Failed to start API: {}", e);
            sleep(Duration::from_secs(API_RESTART_DELAY_SECS)).await;
        }
    }
}

