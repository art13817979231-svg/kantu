use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveAsset {
    pub asset_path: String,
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct OpenedAsset {
    pub id: String,
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct OpenProjectResult {
    pub manifest: String,
    pub temp_dir: String,
    pub assets: Vec<OpenedAsset>,
}

pub fn save_project_zip(path: &str, manifest: &str, assets: &[SaveAsset]) -> Result<(), String> {
    let path_buf = Path::new(path);
    if let Some(parent) = path_buf.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    let file = File::create(path_buf).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    zip.start_file("manifest.json", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(manifest.as_bytes())
        .map_err(|e| e.to_string())?;

    for asset in assets {
        zip.start_file(&asset.asset_path, options)
            .map_err(|e| e.to_string())?;
        zip.write_all(&asset.data).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn open_project_zip(path: &str) -> Result<OpenProjectResult, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir().join(format!("refboard-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let mut manifest = String::new();
    let mut assets = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();
        if name.ends_with('/') {
            continue;
        }

        let mut buffer = Vec::new();
        entry.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

        if name == "manifest.json" {
            manifest = String::from_utf8(buffer).map_err(|e| e.to_string())?;
            continue;
        }

        let out_path = temp_dir.join(&name);
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&out_path, &buffer).map_err(|e| e.to_string())?;

        if name.starts_with("assets/") {
            let id = Path::new(&name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&name)
                .to_string();
            assets.push(OpenedAsset {
                id,
                path: out_path.to_string_lossy().to_string(),
            });
        }
    }

    if manifest.is_empty() {
        return Err("manifest.json not found in project file".to_string());
    }

    Ok(OpenProjectResult {
        manifest,
        temp_dir: temp_dir.to_string_lossy().to_string(),
        assets,
    })
}

pub fn read_file_bytes(path: &str) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(|e| e.to_string())
}

pub fn is_image_path(path: &str) -> bool {
    let lower = path.to_lowercase();
    [
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".tiff", ".tif",
    ]
    .iter()
    .any(|ext| lower.ends_with(ext))
}

pub fn filter_image_paths(paths: Vec<String>) -> Vec<String> {
    paths.into_iter().filter(|p| is_image_path(p)).collect()
}
