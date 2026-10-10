const MAKE_HISTORY_WEBHOOK_URL = "https://hook.us2.make.com/oqnqhd5bou4a7aioi5hlblovf6no82ix";

const historyRows = document.getElementById("historyRows");
const historyStatus = document.getElementById("historyStatus");
const refreshHistoryButton = document.getElementById("refreshHistory");

const RESULT_STYLES = {
	"APROBADO": "success",
	"APROBADO CON ALERTA": "warning",
	"RECHAZADO": "danger",
	"RUTA DE RESPALDO": "info",
	"ERROR DE COMUNICACIÓN": "danger"
};

const DEVELOPMENT_MOVEMENTS = [
	{
		fecha: "2026-10-05",
		codigoProducto: "INS-0101",
		producto: "Harina de trigo x 25 kg",
		cantidad: 10,
		cliente: "Cliente de prueba",
		resultado: "APROBADO",
		saldoAnterior: 48,
		saldoNuevo: 38
	},
	{
		fecha: "2026-10-05",
		codigoProducto: "INS-0102",
		producto: "Azúcar refinada x 50 kg",
		cantidad: 5,
		cliente: "Cliente de prueba",
		resultado: "APROBADO CON ALERTA",
		saldoAnterior: 12,
		saldoNuevo: 7
	},
	{
		fecha: "2026-10-05",
		codigoProducto: "INS-0204",
		producto: "Arroz blanco x 25 kg",
		cantidad: 7,
		cliente: "Cliente de prueba",
		resultado: "APROBADO CON ALERTA",
		saldoAnterior: 7,
		saldoNuevo: 0
	}
];

function createTextElement(tagName, className, text) {
	const element = document.createElement(tagName);
	element.className = className;
	element.textContent = text;
	return element;
}

function getDisplayValue(value) {
	return value === undefined || value === null || String(value).trim() === ""
		? "-"
		: String(value);
}

function showHistoryStatus(message, type) {
	historyStatus.textContent = message;
	historyStatus.className = `alert alert-${type} mb-3`;
}

function renderMovements(movements) {
	historyRows.replaceChildren();

	if (movements.length === 0) {
		const row = document.createElement("tr");
		const cell = createTextElement("td", "text-center text-body-secondary py-4", "No hay movimientos para mostrar.");
		cell.colSpan = 8;
		row.append(cell);
		historyRows.append(row);
		return;
	}

	for (const movement of movements) {
		const row = document.createElement("tr");
		const result = getDisplayValue(movement.resultado || movement.estado);
		const resultStyle = RESULT_STYLES[result.toLocaleUpperCase("es")] || "secondary";
		const values = [
			movement.fecha,
			movement.codigoProducto,
			movement.producto,
			movement.cantidad,
			movement.cliente,
			result,
			movement.saldoAnterior,
			movement.saldoNuevo
		];

		values.forEach((value, index) => {
			const cell = document.createElement("td");
			if (index === 5 && result !== "-") {
				cell.append(createTextElement("span", `badge text-bg-${resultStyle}`, result));
			} else {
				cell.textContent = getDisplayValue(value);
			}
			row.append(cell);
		});

		historyRows.append(row);
	}
}

function normalizeMovements(data) {
	if (Array.isArray(data)) {
		return data;
	}

	if (data && typeof data === "object" && Array.isArray(data.movimientos)) {
		return data.movimientos;
	}

	throw new Error("INVALID_RESPONSE");
}

async function loadHistory() {
	refreshHistoryButton.disabled = true;
	refreshHistoryButton.textContent = "Cargando...";

	if (!MAKE_HISTORY_WEBHOOK_URL.trim()) {
		renderMovements(DEVELOPMENT_MOVEMENTS);
		showHistoryStatus("Datos mock de desarrollo. Configura MAKE_HISTORY_WEBHOOK_URL para consultar movimientos reales.", "warning");
		refreshHistoryButton.disabled = false;
		refreshHistoryButton.textContent = "Actualizar";
		return;
	}

	showHistoryStatus("Consultando el historial en Make...", "info");
	historyRows.replaceChildren();

	try {
		const response = await fetch(MAKE_HISTORY_WEBHOOK_URL, {
			method: "GET",
			headers: {
				"Accept": "application/json"
			}
		});

		if (!response.ok) {
			throw new Error("HTTP_ERROR");
		}

		const movements = normalizeMovements(await response.json());
		renderMovements(movements);
		showHistoryStatus("Historial actualizado desde Make.", "success");
	} catch (error) {
		renderMovements([]);
		const message = error.message === "INVALID_RESPONSE"
			? "Make respondió con un formato de historial no reconocido."
			: "No fue posible consultar el historial en Make. Revisa la conexión y la configuración del webhook.";
		showHistoryStatus(message, "danger");
	} finally {
		refreshHistoryButton.disabled = false;
		refreshHistoryButton.textContent = "Actualizar";
	}
}

refreshHistoryButton.addEventListener("click", loadHistory);
loadHistory();
