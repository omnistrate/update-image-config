"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        // Read inputs
        const username = core.getInput('username', { required: true });
        const password = core.getInput('password', { required: true });
        const serviceId = core.getInput('service-id');
        const serviceApiId = core.getInput('service-api-id');
        const productTierId = core.getInput('product-tier-id');
        const imageConfigId = core.getInput('image-config-id');
        const tag = core.getInput('tag', { required: true });
        const releaseDescription = core.getInput('release-description');
        // First API call: Sign In
        const signInResponse = await fetch('https://api.omnistrate.cloud/2022-09-01-00/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username, hashedPassword: password })
        });
        const signInData = await signInResponse.json();
        const jwtToken = signInData.jwtToken;
        if (!jwtToken) {
            throw new Error('Failed to get jwtToken from the sign-in response');
        }
        // Second API call: Update Image Config
        await fetch(`https://api.omnistrate.cloud/2022-09-01-00/service/${serviceId}/image-config/${imageConfigId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ imageTag: tag })
        });
        // Third API call: Release Service API
        await fetch(`https://api.omnistrate.cloud/2022-09-01-00/service/${serviceId}/service-api/${serviceApiId}/release`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                isPreferred: false,
                productTierId: productTierId,
                versionSetName: releaseDescription,
                versionSetType: 'Major'
            })
        });
        console.log('Action completed successfully');
    }
    catch (error) {
        core.setFailed(`Action failed with error: ${error}`);
    }
}
exports.run = run;
//# sourceMappingURL=main.js.map