const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (requiredUserType) => {
  return (req, res, next) => {
    console.log("🛠 Middleware ejecutado. Verificando token...");

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("❌ No se recibió token.");
      return res.status(403).json({ message: "❌ Token required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
      console.log("✅ Token válido. Usuario:", decoded);

      if (requiredUserType && decoded.userType !== requiredUserType) {
        console.log(
          `❌ Acceso denegado. Se requiere ${requiredUserType}, pero el usuario es ${decoded.userType}`
        );
        return res
          .status(403)
          .json({ message: `❌ Access denied for ${decoded.userType}` });
      }

      console.log("✅ Usuario autorizado. Continuando con la ejecución...");
      next(); 
    } catch (error) {
      console.log("❌ Error al verificar token:", error.message);
      return res.status(401).json({ message: "❌ Invalid token" }); 
  
    }
  };
};

module.exports = authMiddleware;
