// apps/backend/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productosRouter from "./routes/productos";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/productos", productosRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
