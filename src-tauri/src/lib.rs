mod sidecar;

use std::process::Command;
use tauri::Manager;

#[tauri::command]
fn open_in_editor(path: String, editor: String) -> Result<(), String> {
    let editor_label = match editor.as_str() {
        "vscode" => "Visual Studio Code",
        "cursor" => "Cursor",
        _ => return Err(format!("Editor desconhecido: {editor}")),
    };

    #[cfg(target_os = "macos")]
    let spawn_result = Command::new("open").args(["-a", editor_label, &path]).spawn();

    #[cfg(not(target_os = "macos"))]
    let spawn_result = {
        let bin = if editor == "vscode" { "code" } else { "cursor" };
        Command::new(bin).arg(&path).spawn()
    };

    spawn_result
        .map_err(|e| format!("Não foi possível abrir o {editor_label}. Verifique se está instalado. ({e})"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            })
        )
        .invoke_handler(tauri::generate_handler![open_in_editor])
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                sidecar::start_services(&app_handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
