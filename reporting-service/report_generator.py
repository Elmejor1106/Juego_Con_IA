from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import pandas as pd
from io import BytesIO
from datetime import datetime

def get_image_activity_data(engine):
    """
    Consulta la base de datos para obtener datos sobre la actividad de las imágenes.

    Args:
        engine: El motor de base de datos de SQLAlchemy.

    Returns:
        tuple: Una tupla conteniendo dos DataFrames de Pandas:
               - df_daily_counts: Imágenes creadas por día.
               - df_type_summary: Resumen de imágenes por tipo de archivo.
    """
    query_daily_counts = """
        SELECT DATE(created_at) as dia, COUNT(id) as total
        FROM images
        GROUP BY DATE(created_at)
        ORDER BY dia;
    """
    query_type_summary = """
        SELECT SUBSTRING_INDEX(filename, '.', -1) as tipo_archivo, COUNT(id) as total
        FROM images
        GROUP BY tipo_archivo
        ORDER BY total DESC;
    """
    df_daily_counts = pd.read_sql(query_daily_counts, engine)
    df_type_summary = pd.read_sql(query_type_summary, engine)

    return df_daily_counts, df_type_summary

def generate_image_activity_pdf(df_daily_counts: pd.DataFrame, df_type_summary: pd.DataFrame) -> BytesIO:
    """
    Genera un informe en PDF para la actividad de imágenes con dos tablas.

    Args:
        df_daily_counts (pd.DataFrame): DataFrame con el conteo de imágenes por día.
        df_type_summary (pd.DataFrame): DataFrame con el resumen de imágenes por tipo.

    Returns:
        BytesIO: El buffer de bytes que contiene el PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Título principal
    elements.append(Paragraph("Reporte de Actividad de Imágenes", styles['h1']))
    elements.append(Spacer(1, 12))

    # Fecha de generación
    generation_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    elements.append(Paragraph(f"Generado el: {generation_date}", styles['Normal']))
    elements.append(Spacer(1, 24))

    # --- Tabla 1: Imágenes Creadas por Día ---
    elements.append(Paragraph("Imágenes Creadas por Día", styles['h2']))
    elements.append(Spacer(1, 12))

    if not df_daily_counts.empty:
        table_data_daily = [df_daily_counts.columns.to_list()] + df_daily_counts.values.tolist()
        table_daily = Table(table_data_daily)
        table_daily.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table_daily)
    else:
        elements.append(Paragraph("No se encontraron datos de imágenes por día.", styles['Normal']))

    elements.append(Spacer(1, 24))

    # --- Tabla 2: Resumen por Tipo de Archivo ---
    elements.append(Paragraph("Resumen por Tipo de Archivo", styles['h2']))
    elements.append(Spacer(1, 12))

    if not df_type_summary.empty:
        table_data_summary = [df_type_summary.columns.to_list()] + df_type_summary.values.tolist()
        table_summary = Table(table_data_summary)
        table_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table_summary)
    else:
        elements.append(Paragraph("No se encontraron datos de tipos de archivo.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_pdf_report(data: pd.DataFrame, title: str) -> BytesIO:
    """
    Genera un informe en PDF a partir de un DataFrame de Pandas.

    Args:
        data (pd.DataFrame): Los datos para el informe.
        title (str): El título del informe.

    Returns:
        BytesIO: El buffer de bytes que contiene el PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Título del reporte
    elements.append(Paragraph(title, styles['h1']))
    elements.append(Spacer(1, 12))

    # Fecha de generación
    generation_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    elements.append(Paragraph(f"Generado el: {generation_date}", styles['Normal']))
    elements.append(Spacer(1, 24))

    # Convertir DataFrame a una lista de listas para la tabla
    if not data.empty:
        table_data = [data.columns.to_list()] + data.values.tolist()
        
        # Estilo de la tabla
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ])
        
        # Crear y añadir la tabla
        table = Table(table_data)
        table.setStyle(style)
        elements.append(table)
    else:
        elements.append(Paragraph("No se encontraron datos para este informe.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer
