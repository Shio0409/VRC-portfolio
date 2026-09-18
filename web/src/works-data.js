// Confirmed titles and presentation plans only. Assets and credits are unassigned.
export const works = [
  {id:'pupil', title:'生意気pupil', formats:['3D衣装展示','360° Viewer']},
  {id:'candle', title:'アロマキャンドル', formats:['3D Object展示','360° Viewer']},
  {id:'osc', title:'ムチォOSC割り込みシステム', formats:['概要','仕組み説明','Demo Video']},
  {id:'sync', title:'Syncパーティクルシステム', formats:['Particle表現','同期についての説明','Demo Video']},
  {id:'instruments', title:'にゃんぐどらむ・鉄琴', formats:['3D展示','360° Viewer','演奏Demo Video']},
].map(work => ({...work, year:null, category:null, tools:null, role:null, description:null, link:null, model:null, video:null}));
