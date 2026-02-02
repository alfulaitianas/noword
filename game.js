const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const peerIdDisplay = document.getElementById('peer-id-display');
const joinInput = document.getElementById('join-id');
const wordDisplay = document.getElementById('secret-word');
const statusDisplay = document.getElementById('status');

let peer, conn;
let connections = [];
const words = ["صاروخ", "كاميرا", "بيت شعر", "سمكة قرش", "برج خليفة", "سماعة", "قهوة", "خفاش", "بركان", "مخ"];

// تهيئة PeerJS
peer = new Peer();

peer.on('open', (id) => {
    peerIdDisplay.innerText = id;
    statusDisplay.innerText = "متصل وجاهز للعب";
});

// نسخ المعرف عند الضغط عليه
peerIdDisplay.onclick = () => {
    navigator.clipboard.writeText(peerIdDisplay.innerText);
    alert("تم نسخ المعرف! أرسله لأصدقائك.");
};

// منطق المضيف
peer.on('connection', (c) => {
    connections.push(c);
    setupDataListener(c);
    statusDisplay.innerText = "لاعب جديد انضم!";
});

// منطق الضيف
function connectToHost() {
    const hostId = joinInput.value;
    if(!hostId) return;
    conn = peer.connect(hostId);
    setupDataListener(conn);
}

function setupDataListener(connection) {
    connection.on('data', (data) => {
        if (data.type === 'draw') drawRemote(data.x, data.y, data.isDrawing);
        if (data.type === 'clear') ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    connection.on('open', () => { statusDisplay.innerText = "أنت الآن داخل الغرفة!"; });
}

// الرسم
let isDrawing = false;

const getCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
};

const startDrawing = (e) => { isDrawing = true; draw(e); };
const stopDrawing = () => { isDrawing = false; ctx.beginPath(); };

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, {passive: false});

function draw(e) {
    if (!isDrawing) return;
    const {x, y} = getCoords(e);

    drawRemote(x, y, true);
    
    const payload = { type: 'draw', x, y, isDrawing: true };
    if (conn) conn.send(payload);
    connections.forEach(c => c.send(payload));
}

function drawRemote(x, y, drawing) {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const payload = { type: 'clear' };
    if (conn) conn.send(payload);
    connections.forEach(c => c.send(payload));
}

function generateWord() {
    const word = words[Math.floor(Math.random() * words.length)];
    wordDisplay.innerText = "كلمتك السرية: " + word;
}
