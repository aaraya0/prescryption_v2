const RecetaContract = artifacts.require("RecetaContract");

module.exports = function(deployer) {
    deployer.deploy(RecetaContract);
};
