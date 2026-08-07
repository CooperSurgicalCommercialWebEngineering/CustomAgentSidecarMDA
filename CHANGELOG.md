# Changelog

Notable user-visible changes to Agent Sidecar Platform are recorded here.

## Unreleased

### Added

- A CooperSurgical-inspired visual theme for the Model-driven App sidecar, with blue and purple accents, refined conversation chrome, and branded loading, sign-in, and error states.
- Rounded asymmetric agent and user message bubbles with subtle tails, plus updated composer, suggested-action, avatar, and status styling.
- Model-driven build, type-check, and regression-test coverage in pull-request CI.

### Notes

- The theme uses portable system fonts rather than CooperSurgical's proprietary typeface.
- Maintainers can customize the shell in `model-driven/webresources/maftagsc_/copilot/agentSidePane.template.html` and Web Chat styling in `model-driven/webresources/maftagsc_/copilot/agentSidePane.ts`.
