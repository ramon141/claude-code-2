use std::path::PathBuf;
use std::process::Stdio;
use tauri::AppHandle;
use tauri::Manager;
use tokio::process::Command;
use tokio::time::{sleep, Duration};

const API_STARTUP_WAIT_SECS: u64 = 3;
const API_PORT: u16 = 3000;
const API_HEALTH_RETRIES: u32 = 15;
const API_HEALTH_RETRY_INTERVAL_SECS: u64 = 2;

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

pub async fn start_services(app: &AppHandle) {
    let apps_root = resolve_apps_root(app);
    let node = resolve_node();

    start_api(&node, &apps_root).await;
    start_interface(&node, &apps_root).await;
}

async fn start_api(node: &str, apps_root: &PathBuf) {
    let api_dir = apps_root.join("apps/api");
    let entry = resolve_entry(apps_root, "apps/api", "index.js", "index.js");
    let env_file = api_dir.join(".env");

    if !entry.exists() {
        eprintln!("[sidecar] API entry not found: {}", entry.display());
        return;
    }

    let env_vars = load_env_file(&env_file);

    let mut cmd = Command::new(node);
    cmd.arg(&entry)
        .current_dir(&api_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
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

            tokio::spawn(async move {
                let _ = child.wait().await;
                eprintln!("[sidecar] API process exited");
            });
        }
        Err(e) => eprintln!("[sidecar] Failed to start API: {}", e),
    }
}

async fn start_interface(node: &str, apps_root: &PathBuf) {
    let iface_dir = apps_root.join("apps/interface");
    let entry = resolve_entry(apps_root, "apps/interface", "main.js", "main.js");
    let env_file = iface_dir.join(".env");

    if !entry.exists() {
        eprintln!("[sidecar] Interface entry not found: {}", entry.display());
        return;
    }

    let env_vars = load_env_file(&env_file);

    let mut cmd = Command::new(node);
    cmd.arg(&entry)
        .current_dir(&iface_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .envs(env_vars);

    match cmd.spawn() {
        Ok(mut child) => {
            println!("[sidecar] Interface daemon started (pid={})", child.id().unwrap_or(0));
            tokio::spawn(async move {
                let _ = child.wait().await;
                eprintln!("[sidecar] Interface process exited");
            });
        }
        Err(e) => eprintln!("[sidecar] Failed to start interface: {}", e),
    }
}
