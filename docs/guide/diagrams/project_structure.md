# Mapa Estructural del Proyecto

Este diagrama representa la organización de **alto nivel** de tu Monorepo. Muestra cómo están divididas las aplicaciones, los servicios y las librerías compartidas.

```mermaid
graph TD
    %% Estilos
    classDef app fill:#0984e3,color:white,stroke:#00cec9,stroke-width:2px;
    classDef service fill:#6c5ce7,color:white,stroke:#a29bfe,stroke-width:2px;
    classDef package fill:#e17055,color:white,stroke:#fab1a0,stroke-width:2px,stroke-dasharray: 5 5;
    classDef db fill:#2d3436,color:white,stroke:#636e72,stroke-width:4px;

    subgraph APPS [📱 Aplicaciones (Públicas)]
        Gateway("🛡️ Gateway (BFF)"):::app
        Web("💻 Frontend (Next.js)"):::app
        Bot("🤖 Telegram Bot"):::app
    end

    subgraph SERVICES [🧠 Servicios (Privados)]
        Identity("🔐 Identity"):::service
        Billing("💰 Billing"):::service
        Fiscal("📜 Fiscal"):::service
        MasterData("📦 Master Data"):::service
    end

    subgraph PACKAGES [📦 Paquetes Compartidos (Librerías)]
        Database("💾 @template/database
        (Prisma + Clients)"):::package
        
        Shared("💎 @template/shared-kernel
        (Entities, Results, Errors)"):::package
        
        Contracts("🤝 @template/contracts
        (DTOs, Zod Schemas)"):::package
    end

    subgraph INFRA [🏗️ Infraestructura]
        Postgres[("🐘 PostgreSQL")]:::db
    end

    %% Relaciones de Dependencia
    
    %% Gateway consume Servicios
    Gateway -->|REST/HTTP| Identity
    Gateway -->|REST/HTTP| Billing
    Gateway -->|REST/HTTP| MasterData

    %% Frontend consume Gateway
    Web -->|HTTPS| Gateway
    Bot -->|HTTPS| Gateway

    %% Servicios usan Paquetes
    Billing --> Database
    Billing --> Shared
    Billing --> Contracts
    
    Identity --> Database
    Identity --> Shared
    
    %% Paquetes conectan a Infra
    Database --> Postgres

```

### Leyenda
1.  **Azul (Apps)**: Lo único que toca el usuario final o internet.
2.  **Violeta (Servicios)**: Tu lógica de negocio real. Nadie entra aquí directo, solo a través del Gateway.
3.  **Naranja (Paquetes)**: Código que escribes UNA vez y reciclas en todos los servicios (Base de datos, modelos comunes).
4.  **Negro (Infra)**: Tu base de datos real. Solo el paquete `@template/database` tiene permiso de tocarla.
