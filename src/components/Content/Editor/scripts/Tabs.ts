import { writeFile, writeTextFile } from '@tauri-apps/api/fs';
import { writable } from 'svelte/store';
import { loadFile } from '../../../FileTree/scripts/TreeData';
import CodeMirrorEditor from '../CodeMirrorEditor.svelte';
import { getLang } from './Editor';
export let tabs = writable([]);
export let tabinfo = writable("");
export let hidden = writable(true);

class Tab {
    label: string;
    path: string;
    language: string = "Plain Text";
    id: number;
    active: boolean;
    editor: CodeMirrorEditor | null;
    editorcontent: string;
    saved: boolean;
    constructor(id: number, file , editor = null, active: boolean = false, saved: boolean = true) {
        this.id = id;
        this.label = file.filename === "" ? `Untitled-${id}` : file.filename;
        this.path = file.path;
        this.active = active;
        this.editor = editor;
        this.editorcontent = file.content;
        this.saved = saved;

        let filepath = file.path.split(".");
        let extension = "txt";
        if (filepath.length !== 1) {
            extension = filepath.at(-1);
        }
        this.language = getLang(extension);
        
        let _ = undefined;
        this.editor.$on("input", (e) => {
            clearTimeout(_);
            _ = setTimeout(() => {
                writeFile(this.path, e.detail);
                console.log(`${this.label} saved`)
            }, 1000)
        })
    }    
}

let id = 0;
let activeid;
let tablist: Tab[] = [];
export async function addTab(f: string) {
    if (tablist.find(file => file.path === f)) {
        setActive(tablist.find(file => file.path === f).id);
        return;
    }
    let file = await loadFile(f);
    let editor = new CodeMirrorEditor({ target: document.getElementById("tabview"), props: { content: file.content } });
    let tab = new Tab(id, file, editor);
    
    tablist = [...tablist, tab];
    if (tablist.length > 0) {
        hidden.set(false);
    }
    
    tabs.set(tablist);
    setActive(id);
    id++;
}

export function setActive(id) {
    for (let tab of tablist) {
        if (tab.id === id) {
            activeid = id;
            tab.active = true;
            tabinfo.set(tab.language);
        }
        else {
            tab.active = false;
        }
    }
    tabs.set(tablist);
    updateEditorVisibility();
}

function updateEditorVisibility() {
    for (let tab of tablist) {
        tab.editor.$set({ hidden: !(tab.id === activeid) })
    }
}

export function closeTab(tabid: number) {
    if (activeid === tabid) {
        for (let i = 0; i <= tablist.length - 1; i++) {
            if (tablist[i].id === tabid && tablist[i + 1]) {
                setActive(tablist[i + 1].id);
                break;
            }
            else if (tablist[i].id === tabid && tablist[i - 1]) {
                setActive(tablist[i - 1].id);
                break;
            }
        }
    }

    tablist.find(t => t.id === tabid).editor.$destroy();
    tablist = tablist.filter(t => t.id !== tabid);
    tabs.set(tablist);
    
    updateEditorVisibility();
    if (tablist.length === 0) {
        hidden.set(true);
        id = 0;
    }
}