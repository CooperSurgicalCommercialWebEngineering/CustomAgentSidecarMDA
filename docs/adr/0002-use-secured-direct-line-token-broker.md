# Use secured Direct Line with a Dataverse token broker

**Status:** superseded by ADR-0003

The HR Copilot Side Pane will connect to the already-published **HR Management App Guide** through secured Direct Line/Web Chat. A solution-packaged Dataverse Custom API and plug-in will exchange the server-held Direct Line secret for a short-lived conversation token. Because Dataverse doesn't support secure configuration on a Custom API's main-operation plug-in, the API will allow synchronous custom processing steps and the broker plug-in will run as a synchronous `PostOperation` step with the secret in that step's Secure Configuration. Non-secret channel settings may use ordinary environment variables, while Copilot Studio configuration and its SharePoint knowledge sources remain externally managed and outside this solution's lifecycle.

## Consequences

The Direct Line secret is never committed, transported in solution exports, returned to browser code, or stored in a Text environment variable. An administrator must configure and rotate the plug-in step's Secure Configuration separately in each environment. The browser receives only a short-lived conversation token.