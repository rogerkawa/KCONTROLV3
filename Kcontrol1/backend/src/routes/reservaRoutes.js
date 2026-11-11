
import express from "express";

import reservaController from "../controllers/reservaController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import empresaMiddleware from "../middlewares/empresaMidleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);

// Consultas
router.get("/minhas", reservaController.listarMinhas);
router.get("/", roleMiddleware("admin"), reservaController.listar);

// Solicitar e consultar
router.post("/", reservaController.criar);
router.get("/:id/historico", reservaController.historico);
router.get("/:id", reservaController.buscarPorId);

// Ações do funcionário
router.patch("/:id/disponibilizar", reservaController.disponibilizar);
router.post("/:id/extensoes", reservaController.solicitarExtensao);

// Ações administrativas
router.patch("/:id/aprovar", roleMiddleware("admin"), reservaController.aprovar);
router.patch("/:id/recusar", roleMiddleware("admin"), reservaController.recusar);
router.patch("/:id/cancelar", roleMiddleware("admin"), reservaController.cancelar);

router.patch(
    "/extensoes/:id/decidir",
    roleMiddleware("admin"),
    reservaController.decidirExtensao
);

router.post(
    "/:id/manutencoes",
    roleMiddleware("admin"),
    reservaController.criarManutencao
);

router.patch(
    "/manutencoes/:id/cancelar",
    roleMiddleware("admin"),
    reservaController.cancelarManutencao
);

export default router;
