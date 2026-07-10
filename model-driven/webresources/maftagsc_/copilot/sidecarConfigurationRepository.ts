import {
    resolveSidecarConfiguration,
    type SidecarConfiguration
} from "./sidecarConfiguration";

export interface SidecarConfigurationRepository {
    getByAppId(appId: unknown): Promise<SidecarConfiguration>;
}

export class BootstrapSidecarConfigurationRepository
implements SidecarConfigurationRepository {
    constructor(private readonly configurations: readonly SidecarConfiguration[]) {}

    async getByAppId(appId: unknown): Promise<SidecarConfiguration> {
        return resolveSidecarConfiguration(this.configurations, appId);
    }
}
