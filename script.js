// 🔹 CONFIGURA TUS DATOS
const options = {
  username: "admin-cris",
  password: "11Ismyreligion"
};

const client = mqtt.connect("wss://816ed507f62b44af8b039c313433755e.s1.eu.hivemq.cloud:8884/mqtt", options);

let estadoLED = false;
let datosConsumo = [];
let etiquetasTiempo = [];

// 🔹 GRÁFICA
const ctx = document.getElementById('graficaConsumo').getContext('2d');

const grafica = new Chart(ctx, {
  type: 'line',
  data: {
    labels: etiquetasTiempo,
    datasets: [{
      label: 'Consumo (kWh)',
      data: datosConsumo,
      borderWidth: 2,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        title: {
          display: true,
          text: 'kWh'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Tiempo'
        }
      }
    }
  }
});

// 🔹 CONEXIÓN MQTT
client.on("connect", () => {
  console.log("MQTT conectado");
  client.subscribe("casa/consumo");
  client.subscribe("casa/led_estado");
});

// 🔹 MENSAJES
client.on("message", (topic, message) => {
  const msg = message.toString();

  if(topic === "casa/consumo") {
    const tiempo = new Date().toLocaleTimeString();
    etiquetasTiempo.push(tiempo);
    datosConsumo.push(parseFloat(msg));

    if(datosConsumo.length > 20){
      etiquetasTiempo.shift();
      datosConsumo.shift();
    }

    grafica.update();
  }

  if(topic === "casa/led_estado") {
    estadoLED = (msg === "ON");
    actualizarUI();
  }
});

// 🔹 TOGGLE LED
function toggleLED(){
  client.publish("casa/led", estadoLED ? "OFF" : "ON");
}

// 🔹 ACTUALIZAR UI
function actualizarUI(){
  const btn = document.getElementById("toggleBtn");
  const texto = document.getElementById("estadoTexto");

  if(estadoLED){
    btn.classList.remove("off");
    btn.classList.add("on");
    btn.innerText = "ON";
    texto.innerText = "LED encendido";
  } else {
    btn.classList.remove("on");
    btn.classList.add("off");
    btn.innerText = "OFF";
    texto.innerText = "LED apagado";
  }
}

// 🔹 DESCARGAR CSV
function descargarCSV(){
  let csv = "Tiempo,Consumo(kWh)\n";

  for(let i=0;i<datosConsumo.length;i++){
    csv += `${etiquetasTiempo[i]},${datosConsumo[i]}\n`;
  }

  descargarArchivo(csv, "consumo.csv");
}

// 🔹 DESCARGAR JSON
function descargarJSON(){
  const data = datosConsumo.map((valor,i)=>({
    tiempo: etiquetasTiempo[i],
    consumo: valor
  }));

  descargarArchivo(JSON.stringify(data, null, 2), "consumo.json");
}

// 🔹 GENERAR ARCHIVO
function descargarArchivo(contenido, nombre){
  const blob = new Blob([contenido], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
}