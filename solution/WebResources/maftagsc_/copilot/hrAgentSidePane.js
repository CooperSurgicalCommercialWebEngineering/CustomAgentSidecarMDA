(function (root) {
    "use strict";

    const PANE_ID = "maftagsc_hr_management_app_guide";
    const PANE_TITLE = "HR Management App Guide";
    const WEB_RESOURCE_NAME = "maftagsc_/copilot/hrAgentSidePane.html";
    const ICON_WEB_RESOURCE = "WebResources/maftagsc_/copilot/hrGuideLibrary.svg";
    const DEFAULT_WIDTH = 420;
    const SUPPORTED_ENTITIES = new Set([
        "systemuser",
        "position",
        "businessunit",
        "maftagsc_timeofftype",
        "maftagsc_timeoffbalance",
        "maftagsc_timeoffrequest",
        "maftagsc_expensereport",
        "maftagsc_expenseline",
        "maftagsc_benefitplan",
        "maftagsc_benefitenrollment"
    ]);

    function normalizeGuid(value) {
        const normalized = String(value || "").replace(/[{}]/g, "").toLowerCase();
        return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(normalized)
            ? normalized
            : null;
    }

    async function getLaunchContext(formContext) {
        if (!formContext || !formContext.data || !formContext.data.entity) {
            throw new Error("The current form context is unavailable.");
        }

        const entityName = String(formContext.data.entity.getEntityName() || "").toLowerCase();
        if (!SUPPORTED_ENTITIES.has(entityName)) {
            throw new Error("HR Management App Guide is not available for this table.");
        }

        const rawRecordId = formContext.data.entity.getId();
        const recordId = rawRecordId ? normalizeGuid(rawRecordId) : null;
        if (rawRecordId && !recordId) {
            throw new Error("The current record identifier is invalid.");
        }

        const recordName = typeof formContext.data.entity.getPrimaryAttributeValue === "function"
            ? String(formContext.data.entity.getPrimaryAttributeValue() || "").slice(0, 200)
            : "";

        let appId = null;
        try {
            const appProperties = await Xrm.Utility.getGlobalContext().getCurrentAppProperties();
            appId = normalizeGuid(appProperties && appProperties.appId);
        } catch (_error) {
            // App identity is optional; omit it rather than weakening the core context contract.
        }

        return { pageType: "entityrecord", entityName, recordId, recordName, appId };
    }

    function createPageInput(context) {
        return {
            pageType: "webresource",
            webresourceName: WEB_RESOURCE_NAME,
            data: JSON.stringify(context)
        };
    }

    async function ensurePane(formContext) {
        const context = await getLaunchContext(formContext);
        let pane = Xrm.App.sidePanes.getPane(PANE_ID);

        if (!pane) {
            pane = await Xrm.App.sidePanes.createPane({
                paneId: PANE_ID,
                title: PANE_TITLE,
                imageSrc: ICON_WEB_RESOURCE,
                canClose: false,
                isSelected: false,
                alwaysRender: true,
                width: DEFAULT_WIDTH
            });

            await pane.navigate(createPageInput(context));
        }

        return pane;
    }

    async function initialize(executionContext) {
        try {
            const formContext = executionContext && typeof executionContext.getFormContext === "function"
                ? executionContext.getFormContext()
                : null;
            await ensurePane(formContext);
        } catch (error) {
            console.warn("HR Management App Guide couldn't be initialized.", error);
        }
    }

    root.HRAgentSidecar = root.HRAgentSidecar || {};
    root.HRAgentSidecar.initializeGuide = initialize;
}(window));