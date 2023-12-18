export interface IAppConfig {
  port: number;
  webAppUrl: string;
  serverUrl: string;
  cookieSecret: string;
  jwt: {
    secret: string;
    issuer: string;
    accessTokenExpiryTime: string;
    refreshTokenExpiryTime: string;
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
  certificateLocation: string;
  splitWaitingTime: string;
  masterDomains: string[];
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
  minimumWorkshopParticipants: number;
  maximumWorkshopParticipants: number;
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
