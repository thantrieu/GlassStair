let currentDeleteElement = null;
let zoomLevel = 1;

// ================= ZOOM =================
function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 5);
    draw();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.2);
    draw();
}

// ================= HOLES =================
function addHole() {
    const container = document.getElementById("holes-container");
    const count = container.children.length + 1;

    const div = document.createElement("div");
    div.className = "flex gap-2 items-center";

    div.innerHTML = `
        <input type="number" name="holes[]"
               class="flex-1 px-3 py-2 border rounded-lg"
               placeholder="Khoảng cách ${count}">
        <button type="button" onclick="openConfirm(this)"
                                class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                <!-- icon thùng rác (SVG) -->
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4h6v3" />
                                </svg>
                            </button>
    `;

    container.appendChild(div);
}

function openConfirm(button) {
    currentDeleteElement = button;
    document.getElementById("confirm-modal").classList.remove("hidden");
    document.getElementById("confirm-modal").classList.add("flex");
}

function closeModal() {
    document.getElementById("confirm-modal").classList.add("hidden");
    document.getElementById("confirm-modal").classList.remove("flex");
    currentDeleteElement = null;
}

function confirmRemove() {
    const container = document.getElementById("holes-container");

    if (container.children.length === 1) {
        closeModal();
        return;
    }

    if (currentDeleteElement) {
        currentDeleteElement.parentElement.remove();
    }

    updatePlaceholders();
    closeModal();
}

function updatePlaceholders() {
    const inputs = document.querySelectorAll('#holes-container input');
    inputs.forEach((input, index) => {
        input.placeholder = `Khoảng cách ${index + 1}`;
    });
}

// ================= SVG HELPER =================
function create(tag, attrs, text) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    return el;
}

// ================= DRAW =================
function draw() {
    const total_length = +document.querySelector('[name="total_length"]').value || 0;
    const upper_height = +document.querySelector('[name="upper_height"]').value || 0;
    const lower_height = +document.querySelector('[name="lower_height"]').value || 0;
    const concrete = +document.querySelector('[name="concrete_thickness"]').value || 0;
    const step = +document.querySelector('[name="step_height"]').value || 0;

    if (!total_length || !lower_height) return;

    const svg = document.getElementById("drawing");
    svg.innerHTML = "";

    const padding = 120;

    const scale = Math.min(600 / total_length, 600 / lower_height) * zoomLevel;

    const width = total_length * scale;
    const height = lower_height * scale;

    svg.setAttribute("height", height + padding * 2);

    const ox = padding;
    const oy = padding;

    // ===== RECT =====
    svg.appendChild(create("rect", {
        x: ox,
        y: oy,
        width,
        height,
        fill: "none",
        stroke: "black"
    }));

    // ===== D1 =====
    const x1 = ox;
    const y1 = oy + height;

    const x2 = ox + width;
    const y2 = oy + upper_height * scale;

    svg.appendChild(create("line", {
        x1, y1, x2, y2,
        stroke: "blue",
        "stroke-width": 2
    }));

    const dx = x2 - x1;
    const dy = y2 - y1;

    // ===== D3 =====
    const mx = x1;
    const my = y1 - concrete * scale;

    const tL2 = (ox - mx) / dx;
    const Ly = my + dy * tL2;

    const sx3 = ox;
    const sy3 = Ly - step * scale;

    const rightX = ox + width;
    const tR3 = (rightX - sx3) / dx;
    const yR3 = sy3 + dy * tR3;

    svg.appendChild(create("line", {
        x1: sx3,
        y1: sy3,
        x2: rightX,
        y2: yR3,
        stroke: "blue",
        "stroke-width": 2
    }));

    // ===== NỐI D1 - D3 =====
    svg.appendChild(create("line", {
        x1: ox,
        y1: y1,
        x2: ox,
        y2: sy3,
        stroke: "blue"
    }));

    svg.appendChild(create("line", {
        x1: rightX,
        y1: y2,
        x2: rightX,
        y2: yR3,
        stroke: "blue"
    }));

    // ===== HÌNH CHỮ NHẬT MỚI =====

    function intersect(p1, p2, p3, p4) {
        const A1 = p2.y - p1.y;
        const B1 = p1.x - p2.x;
        const C1 = A1 * p1.x + B1 * p1.y;

        const A2 = p4.y - p3.y;
        const B2 = p3.x - p4.x;
        const C2 = A2 * p3.x + B2 * p3.y;

        const det = A1 * B2 - A2 * B1;
        if (det === 0) return null;

        return {
            x: (B2 * C1 - B1 * C2) / det,
            y: (A1 * C2 - A2 * C1) / det
        };
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    const nx = -uy;
    const ny = ux;

    const A = { x: x1, y: y1 };

    const A_perp = {
        x: A.x + nx * 2000,
        y: A.y + ny * 2000
    };

    const D3_p1 = { x: sx3 - dx * 2, y: sy3 - dy * 2 };
    const D3_p2 = { x: sx3 + dx * 2, y: sy3 + dy * 2 };

    const P1 = intersect(A, A_perp, D3_p1, D3_p2);

    const tBottom = (rightX - A.x) / dx;
    const B = {
        x: rightX,
        y: A.y + dy * tBottom
    };

    const P2 = {
        x: rightX,
        y: yR3
    };

    const P2_perp = {
        x: P2.x + nx * 2000,
        y: P2.y + ny * 2000
    };

    const D1_ext1 = { x: x1 - dx * 2, y: y1 - dy * 2 };
    const D1_ext2 = { x: x2 + dx * 2, y: y2 + dy * 2 };

    const P3 = intersect(P2, P2_perp, D1_ext1, D1_ext2);

    const tTop = (rightX - P1.x) / dx;
    const C = {
        x: rightX,
        y: P1.y + dy * tTop
    };

    // ===== KÉO DÀI D1 ĐẾN P3 =====
    if (P3) {
        svg.appendChild(create("line", {
            x1: x2,
            y1: y2,
            x2: P3.x,
            y2: P3.y,
            stroke: "blue",
            "stroke-width": 2
        }));
    }

    // vẽ rectangle mới
    svg.appendChild(create("line", { x1: A.x, y1: A.y, x2: P1.x, y2: P1.y, stroke: "black" }));
    svg.appendChild(create("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: "black" }));
    svg.appendChild(create("line", { x1: P2.x, y1: P2.y, x2: P3.x, y2: P3.y, stroke: "black" }));
    svg.appendChild(create("line", { x1: P1.x, y1: P1.y, x2: C.x, y2: C.y, stroke: "black" }));

    // ===== HOLES =====
    const holeInputs = document.querySelectorAll('[name="holes[]"]');

    let holes = [];
    holeInputs.forEach(i => {
        const v = parseFloat(i.value);
        if (!isNaN(v) && v > 0) holes.push(v);
    });

    let acc = 0;

    // ================= TÍNH TOÁN CHIỀU DÀI TRÊN D1 =================

    // vector đơn vị theo D1
    const cosA = dx / len;
    const sinA = dy / len;

    // hàm tính khoảng cách theo D1 (mm)
    function distOnD1(pStart, pEnd) {
        const dxp = (pEnd.x - pStart.x);
        const dyp = (pEnd.y - pStart.y);
        return Math.round((dxp * cosA + dyp * sinA) / scale);
    }

    // ===== LẤY CÁC GIAO ĐIỂM G =====
    let points = [];

    // điểm đầu
    points.push({ x: x1, y: y1 });

    // các G (từ holes)
    let accTemp = 0;
    holes.forEach(h => {
        accTemp += h;
        const x = ox + accTemp * scale;

        if (x > ox + width) return;

        const t = (x - x1) / dx;
        const yIntersect = y1 + dy * t;

        points.push({ x: x, y: yIntersect });
    });

    // Gx (giao với cạnh phải rect cũ)
    points.push({ x: x2, y: y2 });

    // điểm cuối P3 (D1 kéo dài)
    if (P3) {
        points.push({ x: P3.x, y: P3.y });
    }

    // ===== VẼ TEXT CHO TỪNG ĐOẠN =====
    for (let i = 0; i < points.length - 1; i++) {

        const pA = points[i];
        const pB = points[i + 1];

        const lengthMM = distOnD1(pA, pB);

        // midpoint
        const mxText = (pA.x + pB.x) / 2;
        const myText = (pA.y + pB.y) / 2;

        // đưa text ra ngoài hình chữ nhật mới
        const offsetOutside = 20;

        svg.appendChild(create("text", {
            x: mxText + nx * offsetOutside,
            y: myText + ny * offsetOutside,
            "text-anchor": "middle",
            "font-size": 11,
            fill: "blue"
        }, lengthMM));
    }

    // ======================================================
    // 1. TỔNG KHOẢNG CÁCH TỪ GÓC TRÁI DƯỚI D1 -> GIAO CẠNH PHẢI RECT CŨ -> CẠNH TRÊN RECT MỚI
    // ======================================================

    // đoạn từ A -> B
    const d1MainLength = distOnD1(A, B);

    // đoạn kéo dài từ B -> P3
    const d1ExtendLength = distOnD1(B, P3);

    // tổng chiều dài
    const totalD1Length = d1MainLength + d1ExtendLength;

    // vị trí hiển thị:
    // nửa từ giao D3 bên trái đi lên trên
    const halfLeftX = (A.x + P1.x) / 2;
    const halfLeftY = (A.y + P1.y) / 2;

    // đẩy text ra ngoài rect mới
    const outsideOffset = 40;

    // ======================================================
    // 2. HIỂN THỊ ĐỘ DÀI ĐOẠN D3 KÉO DÀI
    // (từ giao bên trái đến cạnh trái rect mới)
    // ======================================================

    // độ dài đoạn kéo dài D3
    const d3ExtendLength = distOnD1(P1, sx3 ? { x: sx3, y: sy3 } : P1);

    // midpoint đoạn kéo dài D3
    const d3MidX = (P1.x + sx3) / 2;
    const d3MidY = (P1.y + sy3) / 2;

    svg.appendChild(create("text", {
        x: d3MidX - nx * 35,
        y: d3MidY - ny * 5,
        "text-anchor": "middle",
        "font-size": 12,
        fill: "green"
    }, `${Math.abs(d3ExtendLength)}`));

    // ================= CHIỀU DÀI CẠNH RECT MỚI =================

    // cạnh dưới (A → B)
    const lenBottom = distOnD1(A, B);

    // cạnh trên (P1 → C)
    const lenTop = distOnD1(P1, C);

    // ===== cạnh trái & phải (vuông góc D1) =====

    // khoảng cách vuông góc D1 (mm)
    function distPerpD1(pStart, pEnd) {
        const dxp = (pEnd.x - pStart.x);
        const dyp = (pEnd.y - pStart.y);

        // chiếu lên pháp tuyến
        return Math.round(Math.abs((dxp * (-sinA) + dyp * cosA) / scale));
    }

    // cạnh trái (A → P1)
    const lenLeft = distPerpD1(A, P1);

    // cạnh phải (P2 → P3)
    const lenRight = distPerpD1(P2, P3);

    // vẽ text cạnh trái
    svg.appendChild(create("text", {
        x: (A.x + P1.x) / 2 + nx * 35,
        y: (A.y + P1.y) / 2 + ny * 35,
        "text-anchor": "end",
        "font-size": 12,
        fill: "black"
    }, lenLeft));

    // vẽ text cạnh phải
    svg.appendChild(create("text", {
        x: (P2.x + P3.x) / 2 + nx * 35,
        y: (P2.y + P3.y) / 2 + ny * 35,
        "text-anchor": "start",
        "font-size": 12,
        fill: "black"
    }, lenRight));

    const outsideDistance = 55;

    // midpoint bottom
    svg.appendChild(create("text", {
        x: (A.x + B.x) / 2 + nx * outsideDistance,
        y: (A.y + B.y) / 2 + ny * outsideDistance,
        "text-anchor": "middle",
        "font-size": 12,
        fill: "black"
    }, lenBottom));

    // midpoint top
    svg.appendChild(create("text", {
        x: (P1.x + C.x) / 2 - nx * outsideDistance,
        y: (P1.y + C.y) / 2 - ny * outsideDistance,
        "text-anchor": "middle",
        "font-size": 12,
        fill: "black"
    }, lenTop));

    holes.forEach(h => {

        acc += h;
        const x = ox + acc * scale;

        if (x > ox + width) return;

        const t = (x - x1) / dx;
        const yIntersect = y1 + dy * t;

        const r = 6;
        const offset = 30;
        const lift = 15;

        const baseY = yIntersect - lift;
        const cy2 = baseY - offset;

        svg.appendChild(create("circle", { cx: x, cy: baseY, r, stroke: "red", fill: "none" }));
        svg.appendChild(create("circle", { cx: x, cy: cy2, r, stroke: "red", fill: "none" }));

        svg.appendChild(create("line", {
            x1: x,
            y1: cy2,
            x2: x,
            y2: yIntersect,
            stroke: "red",
            "stroke-width": 1.5
        }));

        const textX = x - r - 10;

        svg.appendChild(create("text", {
            x: textX,
            y: cy2,
            "text-anchor": "end",
            "dominant-baseline": "middle",
            fill: "black",
            "font-size": 11
        }, "100"));

        svg.appendChild(create("text", {
            x: textX,
            y: baseY,
            "text-anchor": "end",
            "dominant-baseline": "middle",
            fill: "black",
            "font-size": 11
        }, "50"));
    });
}

// ================= EVENT =================
document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    draw();
});

document.getElementById("btn-add-hole")
    .addEventListener("click", addHole);
