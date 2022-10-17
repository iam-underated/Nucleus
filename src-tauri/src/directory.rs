use async_std::task::{self};
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::{sync::mpsc::channel};

pub fn directory_watcher(dir: &'static str) {
    task::spawn(async move {
        let (sender, receiver) = channel();
        let mut watcher: RecommendedWatcher = Watcher::new(sender, Config::default()).unwrap();
        watcher
            .watch(dir.as_ref(), RecursiveMode::Recursive)
            .unwrap();
        loop {
            match receiver.recv() {
                Ok(event) => {
                    println!("{:?}", event);
                }
                Err(e) => println!("watch error: {:?}", e),
            }
        }
    });
}


