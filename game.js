const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const peerIdDisplay = document.getElementById('peer-id-display');
const joinInput = document.getElementById('join-id');
const wordDisplay = document.getElementById('secret-word');
const statusDisplay = document.getElementById('status');

let peer, conn;
let connections = [];
const words = ["أسد", "سيارة", "بيتزا", "برج إيفل", "طيارة", "كرة قدم", "ساعة", "نظارة", "روبوت", "بطيخ", "شمس", "مظلة"];

// تهيئة الاتصال
peer = new Peer();

peer.on('open', (id) => {
    peerIdDisplay.innerText = id;
    statusDisplay.innerText = "جاهز! أرسل معرفك لأصدقائك.";
});

// المضيف: يستقبل الاتصالات
peer.on('connection', (c) => {
    connections.push(c);
    setupDataListener(c);
    statusDisplay.innerText = "متصل: لاعب جديد دخل الغرفة!";
});

// الضيف: يتصل بالمضيف
function connectToHost() {
    const hostId = joinInput.value;
    if(!hostId) return alert("من فضلك أدخل المعرف");
    conn = peer.connect(hostId);
    setupDataListener(conn);
    statusDisplay.innerText = "جاري الاتصال بالمضيف...";
}

function setupDataListener(connection) {
    connection.on('data', (data) => {
        if (data.type === 'draw') {
            drawRemote(data.x, data.y, data.isDrawing);
        } else if (data.type === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    connection.on('open', () => {
        statusDisplay.innerText = "تم الاتصال! ابدأ الرسم.";
    });
}

// منطق الرسم
let isDrawing = false;
canvas.addEventListener('mousedown', () => { isDrawing = true; ctx.beginPath(); });
canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

// دعم اللمس للجوال
canvas.addEventListener('touchstart', (e) => { isDrawing = true; draw(e.touches[0]); e.preventDefault(); });
canvas.addEventListener('touchend', () => { isDrawing = false; ctx.beginPath(); });

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;

    drawRemote(x, y, true);
    
    const payload = { type: 'draw', x, y, isDrawing: true };
    if (conn) conn.send(payload);
    connections.forEach(c => c.send(payload));
}

function drawRemote(x, y, drawing) {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = "#2c3e50";
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
    const randomWord = words[Math.floor(Math.random() * words.length)];
    wordDisplay.innerText = "كلمتك السرية هي: " + randomWord;
    // الكلمة تظهر فقط للشخص الذي ضغط على الزر
}