require("dotenv").config();

const withFallback = (env, fallbackBase) => ({
  base: process.env[env] || fallbackBase,
  url: (path) => `${process.env[env] || fallbackBase}${path}`,
});

// Microservices
exports.verifyInsurance = withFallback("VERIFY_INSURANCE_URL", "http://verify_insurance:5003");
exports.verifyLicense   = withFallback("VERIFY_LICENSE_URL",   "http://verify_license:5000");
exports.verifyPrescription = withFallback("VERIFY_PRESCRIPTION_URL", "http://verify_prescription:5004");
exports.invoiceService  = withFallback("INVOICE_SERVICE_URL",  "http://invoice_service:5005");

// Frontend 
exports.frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

// Mock token for license api
exports.verifyLicenseToken = process.env.VERIFY_LICENSE_TOKEN || "securetoken123";
