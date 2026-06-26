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

struct ApiCommand {
    executable: PathBuf,
    script_arg: Option<PathBuf>,
}

fn resolve_apps_root(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("project root not found")
            .to_path_buf()
    } else {
        app.path().resource_dir().expect("resource dir not found")
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

fn resolve_api_command(app: &AppHandle) -> ApiCommand {
    if cfg!(debug_assertions) {
        let apps_root = resolve_apps_root(app);
        let node = PathBuf::from(resolve_node());
        let entry = resolve_entry(&apps_root, "apps/api", "index.js", "index.js");
        ApiCommand { executable: node, script_arg: Some(entry) }
    } else {
        let exe_dir = std::env::current_exe()
            .expect("current exe path")
            .parent()
            .expect("exe parent dir")
            .to_path_buf();
        let bin_name = if cfg!(target_os = "windows") { "api.exe" } else { "api" };
        ApiCommand { executable: exe_dir.join(bin_name), script_arg: None }
    }
}

fn resolve_api_dir(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        resolve_apps_root(app).join("apps/api")
    } else {
        app.path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
    }
}

fn resolve_env_file(app: &AppHandle, api_dir: &PathBuf) -> PathBuf {
    if cfg!(debug_assertions) {
        return api_dir.join(".env");
    }
    app.path()
        .app_data_dir()
        .map(|dir| dir.join(".env"))
        .unwrap_or_else(|_| api_dir.join(".env"))
}

struct NgrokConfig {
    enabled: bool,
    domain: Option<String>,
}

fn read_ngrok_config(config_path: &PathBuf) -> NgrokConfig {
    let content = match std::fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(_) => return NgrokConfig { enabled: false, domain: None },
    };
    let val: serde_json::Value = serde_json::from_str(&content).unwrap_or_default();
    let enabled = val.get("ngrokEnabled").and_then(|n| n.as_bool()).unwrap_or(false);
    let domain = val.get("ngrokDomain")
        .and_then(|d| d.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    NgrokConfig { enabled, domain }
}

async fn start_ngrok(ngrok: String, domain: Option<String>) {
    let mut cmd = Command::new(&ngrok);
    cmd.arg("http")
        .arg(API_PORT.to_string())
        .arg("--log=stdout");
    if let Some(ref d) = domain {
        cmd.arg(format!("--url={}", d));
    }
    cmd.stdout(Stdio::null()).stderr(Stdio::null());
    match cmd.spawn() {
        Ok(mut child) => {
            println!("[sidecar] ngrok started (pid={})", child.id().unwrap_or(0));
            let _ = child.wait().await;
            println!("[sidecar] ngrok exited");
        }
        Err(e) => eprintln!("[sidecar] Failed to start ngrok: {}", e),
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
    use rand::RngCore;
    let mut bytes = [0u8; ENCRYPTION_KEY_BYTES];
    rand::thread_rng().fill_bytes(&mut bytes);
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
    let api_cmd = resolve_api_command(app);
    let api_dir = resolve_api_dir(app);
    let env_file = resolve_env_file(app, &api_dir);
    let config_path = resolve_config_path(app, &api_dir);

    for parent in [config_path.parent(), env_file.parent()].into_iter().flatten() {
        let _ = std::fs::create_dir_all(parent);
    }
    ensure_encryption_key(&env_file);

    let ngrok_cfg = read_ngrok_config(&config_path);
    if ngrok_cfg.enabled {
        match resolve_ngrok() {
            Some(ngrok) => { tokio::spawn(start_ngrok(ngrok, ngrok_cfg.domain)); }
            None => eprintln!("[sidecar] ngrok não encontrado — webhook via ngrok indisponível"),
        }
    } else {
        println!("[sidecar] ngrok desabilitado nas configurações");
    }

    loop {
        run_api_once(&api_cmd, &api_dir, &env_file, &config_path).await;
        eprintln!("[sidecar] API process exited — restarting");
        sleep(Duration::from_secs(API_RESTART_DELAY_SECS)).await;
    }
}

async fn run_api_once(
    api_cmd: &ApiCommand,
    api_dir: &PathBuf,
    env_file: &PathBuf,
    config_path: &PathBuf,
) {
    if !api_cmd.executable.exists() {
        eprintln!("[sidecar] API executable not found: {}", api_cmd.executable.display());
        sleep(Duration::from_secs(API_RESTART_DELAY_SECS)).await;
        return;
    }

    let env_vars = load_env_file(env_file);
    let mut cmd = Command::new(&api_cmd.executable);

    if let Some(ref script) = api_cmd.script_arg {
        cmd.arg(script);
    }

    cmd.current_dir(api_dir)
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
