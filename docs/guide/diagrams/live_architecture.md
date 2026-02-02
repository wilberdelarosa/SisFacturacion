# Arquitectura "Viva" (Generada automáticamente)

Este diagrama refleja **la estructura genérica** de un servicio ejemplo en la plantilla.

```mermaid
flowchart TD

    %% Leyenda de Colores
    classDef input fill:#e17055,color:white,stroke:#d63031;
    classDef usecase fill:#74b9ff,color:black,stroke:#0984e3;
    classDef domain fill:#2d3436,color:white,stroke:#636e72;
    classDef output fill:#00b894,color:white,stroke:#00cec9;
    classDef entry fill:#a29bfe,color:black,stroke:#6c5ce7;

    subgraph SERVICE_A [Servicio: A]
        
        subgraph ENTRY [Punto de Entrada]
            Server("server.ts"):::entry
        end

        subgraph ADAPTERS_IN [Adapters Inbound (HTTP)]
            Routes("routes.ts"):::input
        end

        subgraph APPLICATION [Application Layer]
            CreateResource("CreateResource.ts"):::usecase
        end

        subgraph DOMAIN [Domain Layer]
            Resource("Resource.ts"):::domain
            IRepo("IResourceRepository.ts"):::domain
        end

        subgraph ADAPTERS_OUT [Adapters Outbound]
            RepoImpl("PrismaResourceRepository.ts"):::output
        end

    end

    %% Relaciones Reales
    Server -->|Registra| Routes
    Routes -->|Ejecuta| CreateResource
    
    CreateResource -->|Crea| Resource
    CreateResource -->|Persiste usando Interface| IRepo
    
    %% Inyección de Dependencias
    Routes -.->|Inyecta Impl| RepoImpl
    RepoImpl -- Implementa --> IRepo
    RepoImpl -->|Usa| Resource

```

### Análisis del Gráfico
1.  **Entrada (Rojo)**: `routes.ts` recibe la petición web.
2.  **Negocio (Azul)**: `CreateResource.ts` orquesta la regla de negocio.
3.  **Núcleo (Gris)**: `Resource.ts` y sus reglas están protegidos.
4.  **Salida (Verde)**: `PrismaResourceRepository.ts` se encarga de guardar, pero el Negocio no sabe que usa Prisma (solo conoce la interfaz `IResourceRepository`).

---
> Nota: Como no tienes `Graphviz` instalado en este entorno Windows, ejecuté el generador en modo "texto" y creé este Mermaid para que puedas visualizarlo directamente aquí.
