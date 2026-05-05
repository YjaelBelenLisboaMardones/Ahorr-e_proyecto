# Plan de Branching — Ahorr-E

**Asignatura:** DSY1106 — Desarrollo Fullstack III · Duoc UC
**Equipo:** Marco Tassara · Martín Villegas · Jael Lisboa
**Repositorio:** https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto

---

## 1. Modelo de ramas adoptado

El equipo adoptó **GitFlow simplificado** con cuatro tipos de ramas:

```
feature/<nombre>  →  dev  →  qa  →  master
   trabajo            integración    pre-producción    producción
   aislado            del equipo     (testing)         (release)
```

### 1.1. Reglas

| Regla | Detalle |
|---|---|
| **`master` = producción** | Prohibidos los commits directos. Solo recibe merges desde `qa`. |
| **`qa` = pre-producción** | Recibe merges desde `dev` cuando un grupo de features está estable. Sirve para testing integrado antes del release. |
| **`dev` = integración** | Es la rama de trabajo del equipo. Cada feature mergea acá vía Pull Request. |
| **`feature/<nombre>` = trabajo aislado** | Una rama por feature, kebab-case, parte desde `dev`. |
| **Nombres descriptivos** | `feature/auth-supabase`, no `feature/auth` ni `feature/m1`. |
| **Pull Requests obligatorios** | Cada merge a `dev`, `qa` y `master` se hace por PR (review por al menos un miembro del equipo). |

### 1.2. Diagrama de flujo

```
                 commits     commits
feature/auth ───────●────●────●─┐
                                │ PR #3
                                ▼
                  ┌── dev ──●───●───────●─────●─────●─┐
                  │         ▲           ▲           ▲ │ PR #5 release candidate
                  └─PR #1───┘           └─PR #6─────┘ │
                                                      ▼
                                           ┌── qa ──●─┐
                                           │           │ PR #N release a prod
                                           └───────────┘
                                                       ▼
                                                ── master ──●
```

## 2. Procedimiento estándar para cada feature

### 2.1. Iniciar feature

```bash
git checkout dev
git pull
git checkout -b feature/<nombre>
```

### 2.2. Trabajar y commitear

Convención de mensajes (Conventional Commits):

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feat(<scope>)` | Funcionalidad nueva | `feat(auth): registro y login con Supabase` |
| `fix(<scope>)` | Corrección | `fix(prisma): activa directUrl para pooler de Supabase NANO` |
| `chore(<scope>)` | Tareas auxiliares (config, deps) | `chore(gitignore): ignora PDFs de pauta` |
| `refactor(<scope>)` | Refactor sin cambio funcional | `refactor(scraper): mock con whitelist` |

Se prefiere **commits atómicos**: cada commit cubre un cambio coherente, no batch de cambios mezclados.

### 2.3. Cerrar feature

```bash
git push -u origin feature/<nombre>
```

Luego en GitHub: **PR** apuntando `feature/<nombre> → dev`. Con descripción que liste los RFs/RNFs cumplidos.

## 3. Promoción de versiones

### 3.1. Release candidate (`dev → qa`)

Cuando hay un grupo de features estables en `dev`, se abre un PR grande:

- **Título:** `Release candidate v<X>: <resumen de features incluidos>`
- **Descripción:** lista de PRs incluidos, RFs cubiertos, riesgos conocidos.

### 3.2. Release a producción (`qa → master`)

Cuando QA aprueba la release candidate:

- **Título:** `Release v<X>.0 a producción`
- **Descripción:** changelog, migración de datos pendiente (si aplica), rollback plan.

## 4. Historial de PRs ejecutados

| # | Origen | Destino | Feature | RFs/RNFs |
|---|---|---|---|---|
| 1 | `feature/setup-base` | `dev` | Cimientos del proyecto | RNF3 |
| 2 | `dev` | `qa` | Promotion 1 | – |
| 3 | `feature/auth-supabase` | `dev` | Auth + sesión + RLS profiles | RNF1, RNF3 |
| 4 | `qa` | `master` | Release v0.1 | – |
| 5 | `dev` | `qa` | Promotion 2 | – |
| 6 | `feature/presupuestos` | `dev` | CRUD presupuestos + RLS | RF1, RNF1 |
| 7 | `feature/gastos` | `dev` | Gastos + algoritmo compra | RF1, RF7 |
| 10 | `feature/scraping` | `dev` | Microservicio scraping | RF2, RNF6 |
| 11 | `feature/ia-recomendaciones` | `dev` | Microservicio IA con grounding | RF3, RF6 |

> **Nota de transparencia:** El PR de `feature/presupuestos` se mergeó directamente a `master` por una situación puntual de coordinación del equipo. Se identificó como **deuda de proceso** y desde el siguiente feature retomamos el flujo `feature → dev → qa → master`. La evidencia del flujo correcto está en los PRs #7, #10 y #11.

## 5. Manejo de conflictos

### 5.1. Cuándo se generan

- Dos features modifican el mismo archivo en regiones cercanas.
- Un feature mergea a `dev` mientras otro está en desarrollo, dejando `dev` desincronizado del feature local.

### 5.2. Procedimiento

1. **Detección:** GitHub muestra conflicto al abrir el PR. Localmente, `git merge dev` durante la sincronización del feature.
2. **Sincronización local:**
   ```bash
   git checkout feature/<nombre>
   git fetch origin
   git merge origin/dev
   ```
3. **Resolución:** abrir cada archivo conflictivo, decidir qué versión mantener (o combinar). Eliminar marcadores `<<<<<<<`, `=======`, `>>>>>>>`.
4. **Validación:** correr `npm run build` y `npm run lint` antes de continuar.
5. **Commit del merge:**
   ```bash
   git add .
   git commit -m "merge: resuelve conflicto con dev en <archivo>"
   git push
   ```

### 5.3. Conflicto observado en este sprint

Durante el desarrollo paralelo de `feature/scraping` y `feature/ia-recomendaciones`, ambos modificaban `app/(app)/layout.tsx` (agregando enlaces al nav). El conflicto se resolvió manteniendo ambos enlaces. Captura del proceso disponible en el repositorio.

## 6. Buenas prácticas adicionales aplicadas

- **`.gitignore` riguroso:** excluye `.env*` (excepto `.env.example`), `*.docx`, `*.pdf`, `node_modules/`, `.next/`. Garantiza que no se filtren secrets ni binarios.
- **Pull antes de empezar feature:** `git checkout dev && git pull` siempre antes de crear nueva rama, para partir desde el HEAD actualizado.
- **Mensajes en presente imperativo y en español** para coherencia con la documentación interna del proyecto.
- **No reusar nombres de ramas:** una vez mergeada y eliminada, no se reutiliza `feature/<nombre>` para otro propósito.

## 7. Lecciones aprendidas

| Lección | Aplicación futura |
|---|---|
| **PowerShell interpreta paréntesis como subexpresión** | Usar comillas dobles en paths con `()`, ej. `git add "app/(app)/ofertas/page.tsx"`. |
| **`prisma db push --force-reset` es destructivo** | Ejecutar solo en BD vacías o con confirmación explícita del equipo. |
| **Supabase NANO requiere pooler** | El host `db.<ref>.supabase.co` no existe en plan free. Usar `aws-0-<region>.pooler.supabase.com:6543`. |
| **El cache stale-fallback se demostró en producción** | Cuando Falabella cambió su API, el cache-aside sostuvo la app sin crashear. Evidencia clara del valor del patrón. |
| **Mergear directo a master = perder evidencia de branching** | El equipo lo identificó tras `feature/presupuestos`. Desde entonces, disciplina total con el flujo. |

## 8. Capturas que respaldan este documento

> Las siguientes capturas deben adjuntarse al PDF final como evidencia:

1. `git log --oneline --graph --all` mostrando la estructura de ramas con merges.
2. Lista de PRs cerrados en GitHub (https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto/pulls?q=is%3Apr+is%3Aclosed).
3. Detalle de un PR específico (preferiblemente uno con discusión/review entre el equipo).
4. Vista de la rama `master` mostrando solo merges desde `qa`.

---

**Conclusión:** El equipo aplicó un modelo de branching disciplinado que garantiza trazabilidad, aislamiento de cambios y un canal claro de promoción de versiones. La estructura permitió desarrollo paralelo de features sin bloqueos y mantiene `master` siempre en estado releaseable.
