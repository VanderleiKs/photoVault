use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

/// Single-scan guard plus cancellation flag.
#[derive(Default)]
pub struct ScanControl {
    running: AtomicBool,
    cancelled: AtomicBool,
}

impl ScanControl {
    /// Try to start a scan. Returns `None` if one is already running.
    pub fn try_start(self: &Arc<Self>) -> Option<ScanGuard> {
        self.running
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .ok()?;
        self.cancelled.store(false, Ordering::Release);
        Some(ScanGuard {
            control: Arc::clone(self),
        })
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::Acquire)
    }
}

/// Releases the scan slot when dropped (also on error/panic).
pub struct ScanGuard {
    control: Arc<ScanControl>,
}

impl Drop for ScanGuard {
    fn drop(&mut self) {
        self.control.running.store(false, Ordering::Release);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_one_scan_at_a_time() {
        let control = Arc::new(ScanControl::default());
        let guard = control.try_start().expect("first scan starts");
        assert!(control.is_running());
        assert!(control.try_start().is_none());
        drop(guard);
        assert!(control.try_start().is_some());
    }
}
