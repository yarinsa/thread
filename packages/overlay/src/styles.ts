export const styles = `
:host { all: initial; font: 13px/1.4 system-ui, sans-serif; color: #e6e6e6; }
* { box-sizing: border-box; }
.toolbar { position: fixed; right: 16px; bottom: 16px; display: flex; gap: 4px; padding: 4px; background: #1b1b1f; border: 1px solid #333; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.4); z-index: 2147483000; }
.toolbar button { all: unset; cursor: pointer; padding: 6px 10px; border-radius: 6px; color: #ccc; }
.toolbar button:hover { background: #2a2a30; color: #fff; }
.toolbar button[aria-pressed="true"] { background: #56c8ad; color: #0d1b17; }
.pin { position: fixed; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 12px 12px 12px 2px; background: #56c8ad; color: #0d1b17; font-weight: 600; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2147483000; border: 2px solid #0d1b17; }
.pin.resolved { background: #555; color: #ddd; }
.pin.detached { background: #d08a3a; }
.pin.active { outline: 2px solid #fff; }
.panel { position: fixed; width: 320px; max-height: 60vh; overflow: auto; background: #1b1b1f; border: 1px solid #333; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.4); z-index: 2147483001; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.panel header { display: flex; justify-content: space-between; align-items: center; color: #999; font-size: 12px; }
.panel header button, .panel .actions button { all: unset; cursor: pointer; padding: 3px 8px; border-radius: 5px; color: #ccc; }
.panel header button:hover, .panel .actions button:hover { background: #2a2a30; color: #fff; }
.comment { padding: 6px 8px; border-radius: 6px; background: #232329; }
.comment b { color: #fff; }
.comment time { color: #777; font-size: 11px; margin-left: 6px; }
.comment p { margin: 4px 0 0; white-space: pre-wrap; }
textarea { all: unset; display: block; width: 100%; min-height: 60px; padding: 6px 8px; border-radius: 6px; background: #111114; border: 1px solid #333; color: #eee; white-space: pre-wrap; }
textarea:focus { border-color: #56c8ad; }
.actions { display: flex; justify-content: flex-end; gap: 4px; }
.actions .primary { background: #56c8ad; color: #0d1b17; }
.hint { position: fixed; left: 50%; top: 12px; transform: translateX(-50%); background: #1b1b1f; border: 1px solid #333; border-radius: 8px; padding: 6px 12px; z-index: 2147483000; }
.list { position: fixed; right: 16px; bottom: 64px; width: 320px; max-height: 50vh; overflow: auto; background: #1b1b1f; border: 1px solid #333; border-radius: 10px; z-index: 2147483000; padding: 6px; }
.list button { all: unset; display: block; width: 100%; cursor: pointer; padding: 6px 8px; border-radius: 6px; }
.list button:hover { background: #2a2a30; }
.list button.resolved { color: #777; text-decoration: line-through; }
.list .empty { padding: 8px; color: #777; }
`;
