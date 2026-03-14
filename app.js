const video = document.getElementById("preview");   
const canvas = document.getElementById("resultCanvas");  
const ctx = canvas.getContext("2d");  
const flash = document.getElementById("flash");  
const shutterSound = document.getElementById("shutterSound");  

const startBtn = document.getElementById("startBtn");  
const repeatBtn = document.getElementById("repeatBtn");  
const nextBtn = document.getElementById("nextBtn");  
const downloadBtn = document.getElementById("downloadBtn");  
const resetBtn = document.getElementById("resetBtn");  

let photos = [];  
let currentLayout = null;  
let currentIndex = 0;  
let backgroundOption = "beige";  

const layoutCount = { "1":1,"2":2,"3":3,"4":4,"8":4 };  

// ===== CAMERA =====  
navigator.mediaDevices.getUserMedia({  
video:{ facingMode:"user", width:1280, height:960 }  
}).then(stream=>video.srcObject=stream);  

// ===== COUNTDOWN =====  
function countdown(sec, photoNumber){ 
return new Promise(res=>{ 
const overlay=document.createElement("div"); 
overlay.style.position="fixed"; 
overlay.style.inset=0; 
overlay.style.background="rgba(0,0,0,0.7)"; 
overlay.style.display="flex"; 
overlay.style.flexDirection="column"; 
overlay.style.alignItems="center"; 
overlay.style.justifyContent="center"; 
    overlay.style.zIndex=9999; 
 
    // Texto pequeño arriba con número de foto 
    const label=document.createElement("div"); 
    label.textContent=`Foto ${photoNumber}`; 
    label.style.color="#fff"; 
    label.style.fontSize="24px"; 
    label.style.marginBottom="20px"; 
 
    // Texto grande con segundos 
    const counter=document.createElement("div"); 
    counter.style.color="#fff"; 
    counter.style.fontSize="72px"; 
 
    overlay.appendChild(label); 
    overlay.appendChild(counter); 
    document.body.appendChild(overlay); 
 
    let s=sec; 
    counter.textContent=s; 
    const i=setInterval(()=>{ 
      s--; 
      counter.textContent=s; 
      if(s<0){ 
        clearInterval(i); 
        document.body.removeChild(overlay); 
        res(); 
      } 
    },1000); 
  }); 
} 
  
// ===== CAPTURE =====  
function capture(){  
  flash.classList.add("show");  
  shutterSound.currentTime=0;  
  shutterSound.play();  
  
  setTimeout(()=>flash.classList.remove("show"),200);  
  
  const t=document.createElement("canvas");  
  t.width=960; t.height=1280;  
  const c=t.getContext("2d");  
  c.translate(t.width,0);  
  c.scale(-1,1);  
  c.drawImage(video,0,0,t.width,t.height);  
  return t.toDataURL("image/jpeg",0.95);  
}  
  
// ===== DRAW =====  
function drawCover(img,slot){  
  const rI=img.width/img.height;  
  const rS=slot.w/slot.h;  
  let sx,sy,sw,sh;  
  if(rI>rS){  
    sh=img.height; sw=sh*rS;  
    sx=(img.width-sw)/2; sy=0;  
  }else{  
    sw=img.width; sh=sw/rS;  
    sx=0; sy=(img.height-sh)/2;  
  }  
  ctx.drawImage(img,sx,sy,sw,sh,slot.x,slot.y,slot.w,slot.h);  
}  
  
function drawPhotos(callback){  
  
  if(!photos.length){  
    if(callback) callback();  
    return;  
  }  
  
  let slots=[];  
  if(currentLayout==="1")slots=[{x:0,y:0,w:1200,h:1800}];  
  if(currentLayout==="2")slots=[{x:562,y:176,w:588,h:911},{x:36,y:697,w:588,h:911}];  
  if(currentLayout==="3")slots=[{x:574,y:511,w:517,h:754},{x:108,y:938,w:517,h:754},{x:108 
,y:111,w:517,h:754}];  
  if(currentLayout==="4")slots=[  
    {x:0,y:0,w:600,h:900},{x:600,y:0,w:600,h:900},  
    {x:0,y:900,w:600,h:900},{x:600,y:900,w:600,h:900}  
  ];  
  if(currentLayout==="8")slots=[  
    {x:138,y:66,w:320,h:402},{x:138,y:480,w:323,h:408},  
    {x:140,y:900,w:320,h:405},{x:136,y:1319,w:322,h:406},  
    {x:736,y:72,w:320,h:402},{x:737,y:484,w:323,h:408},  
    {x:738,y:900,w:320,h:405},{x:739,y:1317,w:322,h:406}  
  ];  
  
  let loaded=0;  
  let total=slots.length;  
  
  slots.forEach((s,i)=>{  
  
    if(!photos[i] && currentLayout!=="8"){  
      loaded++;  
      if(loaded===total && callback) callback();  
      return;  
    }  
  
    const img=new Image();  
  
    img.onload=()=>{  
      drawCover(img,s);  
      loaded++;  
      if(loaded===total && callback) callback();  
    };  
  
    if(currentLayout==="8"){  
      img.src=photos[i % 4];  
    }else{  
      img.src=photos[i];  
    }  
  });  
}  
  
// ===== UPDATE =====  
const updateBtn = document.querySelector(".update-option");  
const updateInput = document.getElementById("updateInput");  
let customBackground = null;  
  
updateBtn.onclick = () => {  
  updateInput.click();  
};  
  
updateInput.onchange = (e) => {  
  const file = e.target.files[0];  
  if(file){  
    const reader = new FileReader();  
    reader.onload = () => {  
      customBackground = reader.result; // base64 de la imagen subida  
      backgroundOption = "custom";      // nueva opción  
      build();  
    };  
    reader.readAsDataURL(file);  
  }  
};  
  
// ===== WATERMARK =====
let watermarkImage = "marcaagua.png"; // tu archivo PNG fijo
let watermarkPosition = "bottom-right"; // posición inicial

document.querySelectorAll(".watermark-option").forEach(o=>{
  o.onclick=()=>{
    // Activa la marca de agua fija
    build();
  };
});

// ===== BUILD =====
function build(callback){
  function finish(){
    drawPhotos(()=>{
      // Dibujar marca de agua en dos esquinas
      if(watermarkImage){
        const wm = new Image();
        wm.onload = () => {
          // Escala proporcional al tamaño original del PNG
          const maxSize = 200; // tamaño máximo en píxeles
          let wmWidth = wm.width;
          let wmHeight = wm.height;

          // Redimensionar proporcionalmente si excede maxSize
          if(wmWidth > wmHeight){
            const ratio = maxSize / wmWidth;
            wmWidth *= ratio;
            wmHeight *= ratio;
          } else {
            const ratio = maxSize / wmHeight;
            wmWidth *= ratio;
            wmHeight *= ratio;
          }

          ctx.globalAlpha = 0.8;

          // Esquina inferior derecha
          ctx.drawImage(
            wm,
            canvas.width - wmWidth - 20,
            canvas.height - wmHeight - 20,
            wmWidth,
            wmHeight
          );

          // Esquina superior izquierda
          ctx.drawImage(
            wm,
            20,
            20,
            wmWidth,
            wmHeight
          );

          ctx.globalAlpha = 1.0;
        };
        wm.src = watermarkImage;
      }

      canvas.style.display="block";
      canvas.style.opacity=1;
      if(callback) callback();
    });
  }

  // Fondos
  if(backgroundOption==="red"){ ctx.fillStyle="#F44336"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="orange"){ ctx.fillStyle="#FF9800"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="yellow"){ ctx.fillStyle="#FFEB3B"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="lightgreen"){ ctx.fillStyle="#8BC34A"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="green"){ ctx.fillStyle="#4CAF50"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="teal"){ ctx.fillStyle="#009688"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="cyan"){ ctx.fillStyle="#00BCD4"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="blue"){ ctx.fillStyle="#2196F3"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="indigo"){ ctx.fillStyle="#3F51B5"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="purple"){ ctx.fillStyle="#9C27B0"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="deepPurple"){ ctx.fillStyle="#673AB7"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="pink"){ ctx.fillStyle="#E91E63"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="brown"){ ctx.fillStyle="#795548"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="beige"){ ctx.fillStyle="#ebcaa8"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="white"){ ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="black"){ ctx.fillStyle="#000000"; ctx.fillRect(0,0,canvas.width,canvas.height); finish(); }
  else if(backgroundOption==="season"){
    const bg = new Image();
    bg.onload=()=>{ ctx.drawImage(bg,0,0,canvas.width,canvas.height); finish(); };
    bg.src="temporada.jpg"; // asegúrate que este archivo exista en tu carpeta
  }
  else if(backgroundOption==="custom" && customBackground){
    const bg = new Image();
    bg.onload=()=>{ ctx.drawImage(bg,0,0,canvas.width,canvas.height); finish(); };
    bg.src = customBackground;
  }
  else{
    ctx.fillStyle="#f5f5dc"; // fallback beige
    ctx.fillRect(0,0,canvas.width,canvas.height);
    finish();
  }
}
  
// ===== FLOW =====
startBtn.onclick=async()=>{
  if(!currentLayout) return alert("Selecciona un formato");
  await countdown(10, currentIndex+1);
  photos[currentIndex]=capture();

  video.style.opacity=0;
  canvas.style.display="block";
  canvas.style.opacity=1;
  build();

  repeatBtn.disabled=false;
  nextBtn.disabled=false;
};

repeatBtn.onclick=()=>{
  canvas.style.opacity=0;
  setTimeout(()=>{
    canvas.style.display="none";
    video.style.opacity=1;
  },300);
};

nextBtn.onclick=()=>{
  currentIndex++;
  repeatBtn.disabled=true;
  nextBtn.disabled=true;

  if(currentIndex<layoutCount[currentLayout]){
    canvas.style.opacity=0;
    setTimeout(()=>{
      canvas.style.display="none";
      video.style.opacity=1;
    },300);
  }else{
    build();
  }
};
  
// ===== DOWNLOAD =====  
downloadBtn.onclick = () => {
  build(() => {
    setTimeout(() => {
      let count = parseInt(localStorage.getItem("clickandpose_count") || "0");
      count++;
      localStorage.setItem("clickandpose_count", count);

      const zip = new JSZip();

      // Collage final
      const collageData = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
      zip.file(`collage_${count}.jpg`, collageData, {base64:true});

      // Fotos individuales
      photos.forEach((p,i) => {
        zip.file(`foto${i+1}_${count}.jpg`, p.split(",")[1], {base64:true});
      });

      // GIF animado
      gifshot.createGIF({
        images: photos,
        gifWidth: 400,
        gifHeight: 600,
        interval: 1
      }, function(obj) {
        if(!obj.error) {
          const gifData = obj.image.split(",")[1];
          zip.file(`animacion_${count}.gif`, gifData, {base64:true});
        }

        // Intentar generar ZIP
        zip.generateAsync({type:"blob"}).then(content => {
          try {
            saveAs(content, `clickandpose_${count}.zip`);
          } catch(e) {
            // Fallback: descarga individual si ZIP falla
            const a1 = document.createElement("a");
            a1.href = "data:image/jpeg;base64," + collageData;
            a1.download = `collage_${count}.jpg`;
            a1.click();

            photos.forEach((p,i) => {
              const a = document.createElement("a");
              a.href = p;
              a.download = `foto${i+1}_${count}.jpg`;
              a.click();
            });

            if(!obj.error) {
              const aGif = document.createElement("a");
              aGif.href = "data:image/gif;base64," + gifData;
              aGif.download = `animacion_${count}.gif`;
              aGif.click();
            }
          }
        });
      });
    }, 300);
  });
};
  
// ===== PRINT =====
printBtn.onclick = () => {
  build(()=>{
    setTimeout(()=>{
      window.print();
    }, 300); // espera 300ms para que se dibuje todo
  });
};
  
// ===== RESET =====  
resetBtn.onclick = () => {  
  photos = [];  
  currentIndex = 0;  
  currentLayout = null;  
  video.style.opacity = 1;  
  canvas.style.display = "none";  
  repeatBtn.disabled = true;  
  nextBtn.disabled = true;  
  document.querySelectorAll(".layout-option").forEach(o => o.classList.remove("active"));  
  document.querySelectorAll(".background-option").forEach(o =>  
o.classList.remove("active"));  
};  
  
document.querySelectorAll(".layout-option").forEach(o=>{  
o.onclick=()=>{  
if(photos.length) return;  
document.querySelectorAll(".layout-option").forEach(x=>x.classList.remove("active"));  
o.classList.add("active");  
currentLayout=o.dataset.layout;  
};  
});  

// Para la paleta de colores  
document.querySelectorAll(".palette-option").forEach(o=>{  
o.onclick=()=>{  
document.querySelectorAll(".palette-option").forEach(x=>x.classList.remove("active"));  
o.classList.add("active");  
backgroundOption=o.dataset.background;  
build();  
};  
});  

// Para el botón TEMPORADA  
document.querySelectorAll(".season-option").forEach(o=>{  
o.onclick=()=>{  
backgroundOption=o.dataset.background;  
build();  

// No se agrega "active", así que no queda seleccionado permanentemente  
};  
});  
const mirrorBox = document.getElementById("mirrorBox"); 

// Crear contenedor de espejo a pantalla completa  
const mirrorFull = document.createElement("div");  
mirrorFull.id = "mirrorFull";  
const mirrorVideo = document.createElement("video");  
mirrorVideo.autoplay = true;  
mirrorVideo.playsInline = true;  
mirrorFull.appendChild(mirrorVideo);  
document.body.appendChild(mirrorFull);  

// Al hacer clic en ESPEJO  
mirrorBox.onclick = () => {  
navigator.mediaDevices.getUserMedia({  
video: { facingMode: "user", width: 1280, height: 960 }  
}).then(stream => {  
mirrorVideo.srcObject = stream;  
mirrorFull.style.display = "flex";  
});  
}; 

// Al hacer clic en cualquier parte del espejo, se cierra  
mirrorFull.onclick = () => {  
mirrorFull.style.display = "none";  
if (mirrorVideo.srcObject) {  
mirrorVideo.srcObject.getTracks().forEach(track => track.stop());  
mirrorVideo.srcObject = null;  
}  
}; 

