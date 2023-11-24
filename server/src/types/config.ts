export interface IAppConfig {
  port: number;
  webAppUrl: string;
  serverUrl: string;
  cookieSecret: string;
  jwt: {
    secret: string;
    issuer: string;
    accessTokenExpieryTime: string;
    refreshTokenExpieryTime: string;
  };
  email: {
    disabled: true;
    sendgridApiKey: string;
    sendgridTemplateIds: {
      authorChallenge: string;
      emailConfirmation: string;
    };
    defaults: {
      noReplyEmail: string;
      requestsEmail: string;
    };
  };
  https: {
    cert: string;
    privKey: string;
  };
  authCookieName: string;
  authHeaderName: string;
  refreshTokenName: string;
  hashSaltRounds: number;
  allowGraphqlSandbox: boolean;
  sessionProcessorDebugPort?: string | undefined | null;
  syncSequelizeModels: boolean;
}

export interface IDatabaseConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  dialect: "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql";
  port: number;
}

export interface IWorkshopConfig {
  sessionOpeningTimeInMinutes: number;
}

export interface INginxConfig {
  location: string;
  configurationsFolderName: string;
  domainConfigurationTemplateLocation: string;
  testAndReloadScriptName: string;
}

export interface IRedisConfig {
  url: string;
  prefix: string;
  enableInitSync: boolean;
}

export interface IConfig {
  app: IAppConfig;
  db: IDatabaseConfig;
  workshop: IWorkshopConfig;
  redis: IRedisConfig;
  nginx: INginxConfig;
}
