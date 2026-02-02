# Guía de Gestión en GitHub

Esta carpeta explica cómo utilizamos las herramientas de comunidad de GitHub para mantener el proyecto organizado.

## 📂 Segmentación de Documentos

| Archivo | Propósito | Ubicación Real |
| :--- | :--- | :--- |
| **Bug Report** | Reportar errores con pasos reproducibles | `.github/ISSUE_TEMPLATE/bug_report.yml` |
| **Feature Request** | Solicitar nuevas funcionalidades | `.github/ISSUE_TEMPLATE/feature_request.yml` |
| **PR Template** | Checklist obligatorio antes de mergear | `.github/PULL_REQUEST_TEMPLATE.md` |
| **Contributing** | Guía de setup para desarrolladores | `CONTRIBUTING.md` (Raíz) |

## 📐 Flujo de Trabajo (Workflow)

1.  **Issues**: Nadie trabaja sin un Issue. Se debe escoger "Bug" o "Feature" al crearlo.
2.  **Branches**: Se crean desde el issue. Naming convention: `feat/issue-number-name` o `fix/issue-number-name`.
3.  **Pull Requests**:
    *   Al abrir un PR, aparecerá automáticamente el **Checklist**.
    *   Es OBLIGATORIO marcar `I have run pnpm check:arch`.
    *   Si el checklist no está completo, el PR no se revisa.

## 🛡️ Etiquetas (Labels)

*   `triage`: Issue nuevo que necesita revisión.
*   `bug`: Algo está roto.
*   `enhancement`: Nueva funcionalidad.
*   `architecture`: Cambios estructurales que requieren aprobación del Tech Lead.
