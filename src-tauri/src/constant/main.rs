pub fn writer_event_key(id: &u8) -> String {
    format!("writer-{}", id)
}

pub fn resize_event_key(id: &u8) -> String {
    format!("resize-{}", id)
}

pub fn reader_event_key(id: &u8) -> String {
    format!("data-{}", id)
}

pub const DESTROY_TERMINAL: &str = "destroy";
pub const UPDATE_FILES: &str = "files";
