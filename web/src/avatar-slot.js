/** One retained scene per page; preloads during Loading and sleeps off-screen. */
export function setupAvatarSlot(root, openSkills, loadScene = () => import('./avatar-scene.js')) {
  const button=root.querySelector('#avatar-button'),canvas=root.querySelector('#top-avatar-canvas');
  const message=root.querySelector('#avatar-message'),retry=root.querySelector('#avatar-retry');
  let visible=false,request,scene,pending,view={x:0,y:0};
  button.addEventListener('click',openSkills);
  function preload() {
    if(scene) return Promise.resolve(true);
    if(pending) return pending;
    const current=new AbortController();request=current;
    button.disabled=true;button.dataset.ready='false';retry.hidden=true;
    message.hidden=false;message.textContent='アバターを読み込んでいます…';
    pending=(async()=>{
      try {
        const {createAvatarScene}=await loadScene();current.signal.throwIfAborted();
        const loaded=await createAvatarScene({canvas,signal:current.signal});
        if(current.signal.aborted){loaded.dispose();return false;}
        scene=loaded;scene.setVisible?.(visible);
        if(visible)scene.setView?.(view.x,view.y);
        button.disabled=false;button.dataset.ready='true';message.hidden=true;
        return true;
      } catch(error) {
        if(!current.signal.aborted){
          console.error('Avatar load failed',error);
          message.textContent='アバターを表示できませんでした。再試行できます。';retry.hidden=false;
        }
        return false;
      } finally {if(request===current)pending=undefined;}
    })();
    return pending;
  }
  function dispose() {
    request?.abort();request=undefined;pending=undefined;scene?.dispose();scene=undefined;
    button.disabled=true;button.dataset.ready='false';
  }
  retry.addEventListener('click',()=>{if(visible)void preload();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();dispose();message.hidden=false;
    message.textContent='アバターの表示が中断されました。';retry.hidden=false;
  });
  return {
    preload,dispose,
    setView(x,y){view={x,y};if(visible)scene?.setView?.(x,y);},
    setVisible(value){
      visible=value;scene?.setVisible?.(value);
      if(value){if(scene)scene.setView?.(view.x,view.y);else void preload();}
    },
  };
}
