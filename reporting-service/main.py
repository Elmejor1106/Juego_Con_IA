from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import os
# from apscheduler.schedulers.background import BackgroundScheduler

from database import get_db, engine
from schemas import UserReportRequest, GameReportRequest, UserReportType, GameReportType
from report_generator import generate_pdf_report, get_image_activity_data, generate_image_activity_pdf

# --- Lógica para Informes Programados (DESACTIVADA TEMPORALMENTE) ---

# REPORTS_DIR = "generated_reports"

# def generate_weekly_top_games_report():
#     """Función que se ejecuta semanalmente para generar y guardar un informe."""
#     print("Ejecutando tarea programada: generando informe de top 10 juegos.")
#     try:
#         os.makedirs(REPORTS_DIR, exist_ok=True)
#         query = """
#             SELECT g.title, COUNT(gp.id) as jugadas
#             FROM games g
#             JOIN game_plays gp ON g.id = gp.game_id
#             GROUP BY g.id, g.title
#             ORDER BY jugadas DESC
#             LIMIT 10;
#         """
#         df = pd.read_sql(query, engine)
#         pdf_buffer = generate_pdf_report(df, "Top 10 Juegos Más Jugados (Semanal)")
#         file_path = os.path.join(REPORTS_DIR, f"top_10_juegos_{pd.Timestamp.now().strftime('%Y-%m-%d')}.pdf")
#         with open(file_path, 'wb') as f:
#             f.write(pdf_buffer.getvalue())
#         print(f"Informe guardado exitosamente en: {file_path}")
#     except Exception as e:
#         print(f"Error durante la tarea programada: {e}")

# --- Configuración de la App FastAPI ---

app = FastAPI(title="Servicio de Informes", version="0.1.0")

# @app.on_event("startup")
# def startup_event():
#     """Al iniciar la app, se configura y arranca el scheduler."""
#     scheduler = BackgroundScheduler()
#     scheduler.add_job(generate_weekly_top_games_report, 'cron', day_of_week='sun', hour=2)
#     scheduler.start()
#     print("Scheduler iniciado. Las tareas programadas están activas.")


@app.get("/")
def read_root():
    return {"status": "Servicio de informes funcionando"}


@app.get("/reports/images")
def get_image_activity_report(db: Session = Depends(get_db)):
    """Genera un informe de actividad de imágenes en formato PDF."""
    try:
        # 1. Obtener los datos
        df_daily, df_summary = get_image_activity_data(engine)

        # 2. Generar el PDF
        pdf_buffer = generate_image_activity_pdf(df_daily, df_summary)

        # 3. Devolver el PDF
        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=reporte_actividad_imagenes.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el informe de imágenes: {e}")

@app.post("/reports/users")
def get_user_report(request: UserReportRequest, db: Session = Depends(get_db)):
    """Genera un informe de usuarios en formato PDF."""
    query = ""
    title = ""

    if request.report_type == UserReportType.ALL_USERS:
        title = "Listado de Todos los Usuarios"
        query = "SELECT id, username, email, role, status, created_at FROM users;"
    
    elif request.report_type == UserReportType.ACTIVE_VS_INACTIVE:
        title = "Usuarios Activos vs. Inactivos"
        query = "SELECT status, COUNT(id) as total FROM users GROUP BY status;"

    elif request.report_type == UserReportType.REGISTERED_BY_DAY:
        title = "Usuarios Registrados por Día"
        base_query = "SELECT DATE(created_at) as dia, COUNT(id) as total FROM users WHERE 1=1"
        params = {}
        if request.start_date:
            base_query += " AND created_at >= :start_date"
            params['start_date'] = request.start_date
        if request.end_date:
            base_query += " AND created_at <= :end_date"
            params['end_date'] = request.end_date
        query = base_query + " GROUP BY DATE(created_at) ORDER BY dia;"

    if not query:
        raise HTTPException(status_code=400, detail="Tipo de reporte no válido")

    try:
        df = pd.read_sql(query, engine, params=locals().get('params', None))
        pdf_buffer = generate_pdf_report(df, title)
        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=reporte_usuarios_{request.report_type.value.lower()}.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el informe: {e}")

@app.post("/reports/games")
def get_game_report(request: GameReportRequest, db: Session = Depends(get_db)):
    """Genera un informe de juegos en formato PDF."""
    query = ""
    title = ""

    if request.report_type == GameReportType.ALL_GAMES:
        title = "Listado Completo de Juegos"
        query = """
            SELECT g.id, g.title, u.username as autor, g.created_at
            FROM games g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.created_at DESC;
        """

    elif request.report_type == GameReportType.TOP_10_MOST_PLAYED:
        title = "Top 10 Juegos Más Jugados"
        query = """
            SELECT g.title, COUNT(gp.id) as jugadas
            FROM games g
            JOIN game_plays gp ON g.id = gp.game_id
            GROUP BY g.id, g.title
            ORDER BY jugadas DESC
            LIMIT 10;
        """

    elif request.report_type == GameReportType.CREATED_BY_DATE:
        title = "Juegos Creados por Fecha"
        base_query = "SELECT DATE(created_at) as dia, COUNT(id) as total FROM games WHERE 1=1"
        params = {}
        if request.start_date:
            base_query += " AND created_at >= :start_date"
            params['start_date'] = request.start_date
        if request.end_date:
            base_query += " AND created_at <= :end_date"
            params['end_date'] = request.end_date
        query = base_query + " GROUP BY DATE(created_at) ORDER BY dia;"

    if not query:
        raise HTTPException(status_code=400, detail="Tipo de reporte no válido")

    try:
        df = pd.read_sql(query, engine, params=locals().get('params', None))
        pdf_buffer = generate_pdf_report(df, title)
        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=reporte_juegos_{request.report_type.value.lower()}.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el informe: {e}")