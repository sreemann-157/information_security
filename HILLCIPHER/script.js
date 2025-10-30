function mod(n, m) {
  return ((n % m) + m) % m;
}

function modInverse(a, m) {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  throw new Error("No modular inverse exists for determinant " + a);
}

function determinant(matrix, modVal = null) {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let det = 0;
  for (let c = 0; c < n; c++) {
    const minor = matrix.slice(1).map((row) => row.filter((_, j) => j !== c));
    det += (c % 2 === 0 ? 1 : -1) * matrix[0][c] * determinant(minor);
  }
  return modVal ? mod(det, modVal) : det;
}

function inverseMatrix(matrix, modVal) {
  const n = matrix.length;
  const det = determinant(matrix, modVal);
  const detInv = modInverse(det, modVal);
  const adj = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const minor = matrix
        .filter((_, r) => r !== i)
        .map((row) => row.filter((_, c) => c !== j));
      let cofactor = determinant(minor, modVal);
      if ((i + j) % 2 === 1) cofactor = -cofactor;
      adj[j][i] = mod(cofactor * detInv, modVal);
    }
  }
  return adj;
}

function cleanText(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, "");
}
function textToNumbers(text) {
  return cleanText(text)
    .split("")
    .map((c) => c.charCodeAt(0) - 65);
}
function numbersToText(nums) {
  return nums.map((n) => String.fromCharCode(mod(n, 26) + 65)).join("");
}

function multiplyMatrixVector(matrix, vector) {
  const n = matrix.length;
  const result = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) result[i] += matrix[i][j] * vector[j];
    result[i] = mod(result[i], 26);
  }
  return result;
}

function encryptHill(plaintext, key) {
  const n = key.length;
  const nums = textToNumbers(plaintext);
  while (nums.length % n !== 0) nums.push(23); // pad with X
  const cipherNums = [];
  for (let i = 0; i < nums.length; i += n) {
    const block = nums.slice(i, i + n);
    cipherNums.push(...multiplyMatrixVector(key, block));
  }
  return numbersToText(cipherNums);
}

function decryptHill(ciphertext, key) {
  const keyInv = inverseMatrix(key, 26);
  const n = keyInv.length;
  const nums = textToNumbers(ciphertext);
  const plainNums = [];

  for (let i = 0; i < nums.length; i += n) {
    const block = nums.slice(i, i + n);
    plainNums.push(...multiplyMatrixVector(keyInv, block));
  }
  return numbersToText(plainNums);
}

document.getElementById("generateMatrix").addEventListener("click", () => {
  const n = parseInt(document.getElementById("matrixSize").value);
  const container = document.getElementById("matrixInputs");
  container.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const row = document.createElement("div");
    row.className = "matrix-row";
    for (let j = 0; j < n; j++) {
      const input = document.createElement("input");
      input.type = "number";
      input.id = `key-${i}-${j}`;
      input.className = "matrix-cell";
      input.placeholder = "0";
      row.appendChild(input);
    }
    container.appendChild(row);
  }
});

function getMatrixValues(n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const val = parseInt(document.getElementById(`key-${i}-${j}`).value);
      if (isNaN(val)) {
        alert("⚠️ Fill all key matrix values before continuing!");
        throw new Error("Incomplete key matrix");
      }
      row.push(mod(val, 26));
    }
    matrix.push(row);
  }
  return matrix;
}

document.getElementById("encryptBtn").addEventListener("click", () => {
  const n = parseInt(document.getElementById("matrixSize").value);
  const key = getMatrixValues(n);
  const plaintext = document.getElementById("plaintext").value;

  try {
    const cipher = encryptHill(plaintext, key);
    const det = determinant(key, 26);
    const invKey = inverseMatrix(key, 26);
    document.getElementById("ciphertext").textContent = cipher;
    showMatrixDetails(det, invKey);
  } catch (e) {
    alert("Error: " + e.message);
  }
});

document.getElementById("decryptBtn").addEventListener("click", () => {
  const n = parseInt(document.getElementById("matrixSize").value);
  const key = getMatrixValues(n);
  const ciphertext = document.getElementById("ciphertext").textContent;

  try {
    const plain = decryptHill(ciphertext, key);
    const det = determinant(key, 26);
    const invKey = inverseMatrix(key, 26);
    document.getElementById("decrypted").textContent = plain;
    showMatrixDetails(det, invKey);
  } catch (e) {
    alert("Error: " + e.message);
  }
});

function showMatrixDetails(det, invKey) {
  const detVal = mod(det, 26);
  let html = `<p><strong>Determinant (mod 26):</strong> ${detVal}</p>`;
  html += "<p><strong>Inverse Key Matrix:</strong></p><table>";
  invKey.forEach((row) => {
    html += "<tr>" + row.map((v) => `<td>${v}</td>`).join("") + "</tr>";
  });
  html += "</table>";
  document.getElementById("matrixDetails").innerHTML = html;
}
