import { HOSPITAL_SERVICES } from "./hospitalServices";

const SINGLE_ONLY_SERVICES = new Set([
"REA",
"CARDIO_SI",
"NEURO_USINV",
]);

const MORE_SINGLE_SERVICES = new Set([
"USP",
"ONCO_HC",
"UCC_UMA",
"CARDIO_SC",
"NEPHRO_HC",
]);

function buildBeds(serviceCode, roomNumber, roomType) {
if (roomType === "single") {
return [
{
bedId: `${serviceCode}-${roomNumber}`,
label: "Lit",
},
];
}

return [
{
bedId: `${serviceCode}-${roomNumber}-P`,
label: "Porte",
},
{
bedId: `${serviceCode}-${roomNumber}-F`,
label: "Fenêtre",
},
];
}

function buildRooms(serviceCode, capacity, startRoomNumber, mode = "mixed") {
const rooms = [];
let remaining = capacity;
let roomNumber = startRoomNumber;

if (mode === "single_only") {
while (remaining > 0) {
rooms.push({
roomNumber: String(roomNumber),
roomType: "single",
beds: buildBeds(serviceCode, roomNumber, "single"),
});
roomNumber += 1;
remaining -= 1;
}
return rooms;
}

if (mode === "mixed_more_single") {
let singlesTarget = Math.max(1, Math.floor(capacity / 3));
if (capacity <= 12) singlesTarget = Math.max(singlesTarget, 2);

while (remaining > 0) {
const shouldUseSingle =
singlesTarget > 0 && (remaining % 2 !== 0 || remaining === 1 || remaining > 6);

if (shouldUseSingle) {
rooms.push({
roomNumber: String(roomNumber),
roomType: "single",
beds: buildBeds(serviceCode, roomNumber, "single"),
});
roomNumber += 1;
remaining -= 1;
singlesTarget -= 1;
} else if (remaining >= 2) {
rooms.push({
roomNumber: String(roomNumber),
roomType: "double",
beds: buildBeds(serviceCode, roomNumber, "double"),
});
roomNumber += 1;
remaining -= 2;
} else {
rooms.push({
roomNumber: String(roomNumber),
roomType: "single",
beds: buildBeds(serviceCode, roomNumber, "single"),
});
roomNumber += 1;
remaining -= 1;
}
}

return rooms;
}

while (remaining > 0) {
if (remaining === 1) {
rooms.push({
roomNumber: String(roomNumber),
roomType: "single",
beds: buildBeds(serviceCode, roomNumber, "single"),
});
roomNumber += 1;
remaining -= 1;
} else {
rooms.push({
roomNumber: String(roomNumber),
roomType: "double",
beds: buildBeds(serviceCode, roomNumber, "double"),
});
roomNumber += 1;
remaining -= 2;
}
}

return rooms;
}

function getRoomMode(serviceCode) {
if (SINGLE_ONLY_SERVICES.has(serviceCode)) return "single_only";
if (MORE_SINGLE_SERVICES.has(serviceCode)) return "mixed_more_single";
return "mixed";
}

function getStartRoomNumber(index) {
return 100 + index * 100 + 1;
}

export const HOSPITAL_BEDS = HOSPITAL_SERVICES.map((service, index) => ({
serviceCode: service.code,
serviceLabel: service.label,
rooms: buildRooms(
service.code,
Number(service.capacity || 0),
getStartRoomNumber(index),
getRoomMode(service.code)
),
}));