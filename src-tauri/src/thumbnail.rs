use image::imageops::FilterType;
use image::GenericImageView;
use std::io::Cursor;

pub const DEFAULT_THUMB_MAX: u32 = 512;

pub fn generate_thumbnail_bytes(data: &[u8], max_dimension: u32) -> Result<Vec<u8>, String> {
    let img = image::load_from_memory(data).map_err(|e| e.to_string())?;
    let (w, h) = img.dimensions();
    if w <= max_dimension && h <= max_dimension {
        return Ok(data.to_vec());
    }

    let thumb = img.resize(
        max_dimension,
        max_dimension,
        FilterType::Triangle,
    );
    let mut out = Cursor::new(Vec::new());
    thumb
        .write_to(&mut out, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(out.into_inner())
}

pub fn image_dimensions(data: &[u8]) -> Result<(u32, u32), String> {
    let img = image::load_from_memory(data).map_err(|e| e.to_string())?;
    Ok(img.dimensions())
}
