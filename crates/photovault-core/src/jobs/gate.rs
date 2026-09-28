use std::sync::{Arc, Condvar, Mutex};

/// Counting semaphore for blocking threads: caps concurrent disk reads.
#[derive(Clone)]
pub(super) struct IoGate(Arc<(Mutex<usize>, Condvar)>);

pub(super) struct IoPermit<'a>(&'a IoGate);

impl IoGate {
    pub fn new(permits: usize) -> Self {
        Self(Arc::new((Mutex::new(permits.max(1)), Condvar::new())))
    }

    pub fn acquire(&self) -> IoPermit<'_> {
        let (lock, cvar) = &*self.0;
        let mut free = lock.lock().unwrap_or_else(|e| e.into_inner());
        while *free == 0 {
            free = cvar.wait(free).unwrap_or_else(|e| e.into_inner());
        }
        *free -= 1;
        IoPermit(self)
    }
}

impl Drop for IoPermit<'_> {
    fn drop(&mut self) {
        let (lock, cvar) = &*(self.0).0;
        *lock.lock().unwrap_or_else(|e| e.into_inner()) += 1;
        cvar.notify_one();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn never_exceeds_permits() {
        let gate = IoGate::new(2);
        let inside = Arc::new(AtomicUsize::new(0));
        let peak = Arc::new(AtomicUsize::new(0));
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let (gate, inside, peak) = (gate.clone(), inside.clone(), peak.clone());
                std::thread::spawn(move || {
                    let _p = gate.acquire();
                    let now = inside.fetch_add(1, Ordering::SeqCst) + 1;
                    peak.fetch_max(now, Ordering::SeqCst);
                    std::thread::sleep(std::time::Duration::from_millis(20));
                    inside.fetch_sub(1, Ordering::SeqCst);
                })
            })
            .collect();
        threads.into_iter().for_each(|t| t.join().unwrap());
        assert_eq!(peak.load(Ordering::SeqCst), 2);
    }
}
