"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const xenia_module_1 = require("./src/xenia.module");
const PresentationSettings_1 = __importDefault(require("./src/infrastructure/presentation/settings/PresentationSettings"));
const PersistanceSettings_1 = __importDefault(require("./src/infrastructure/persistance/settings/PersistanceSettings"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const common_1 = require("@nestjs/common");
const fs_1 = __importDefault(require("fs"));
async function bootstrap() {
    const logger = new common_1.ConsoleLogger('Main');
    const envs = new PersistanceSettings_1.default().get();
    if (envs.mongoURI == '') {
        logger.debug(`MONGO_URI is undefined!`);
    }
    const app = await core_1.NestFactory.create(xenia_module_1.XeniaModule, {
        rawBody: true,
    });
    const SSL_enabled = envs.SSL == 'true';
    const Swagger_enabled = envs.swagger_API == 'true';
    const Heroku_Nginx_enabled = envs.heroku_nginx == 'true';
    const Nginx_enabled = envs.nginx == 'true';
    if (Swagger_enabled) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Xenia Web API')
            .setDescription('')
            .setVersion('1.0.0')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, document);
    }
    app.enableCors();
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                'script-src': [
                    "'self'",
                    "'unsafe-inline'",
                    "'sha256-Zww3/pDgfYVU8OPCr/mr7NFf4ZA0lY1Xeb22wR47e0w='",
                ],
                upgradeInsecureRequests: SSL_enabled ? [] : null,
            },
        },
    }));
    app.use((0, compression_1.default)());
    const PORT = process.env.PORT || new PresentationSettings_1.default().get().port;
    if (Heroku_Nginx_enabled || Nginx_enabled) {
        app.set('trust proxy', true);
    }
    if (Heroku_Nginx_enabled) {
        await app.listen('/tmp/nginx.socket');
        fs_1.default.openSync('/tmp/app-initialized', 'w');
    }
    else {
        await app.listen(PORT, '0.0.0.0');
    }
    logger.debug(``);
    logger.debug(`Swagger API:\t ${Swagger_enabled ? 'Enabled' : 'Disabled'}`);
    logger.debug(`SSL:\t\t ${SSL_enabled ? 'Enabled' : 'Disabled'}`);
    logger.debug(`Nginx:\t\t ${Nginx_enabled ? 'Enabled' : 'Disabled'}`);
    logger.debug(`Heroku & Nginx:\t ${Heroku_Nginx_enabled ? 'Enabled' : 'Disabled'}`);
    logger.debug(``);
    logger.debug(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map