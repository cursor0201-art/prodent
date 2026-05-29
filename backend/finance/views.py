from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from django.http import HttpResponse
from .models import Transaction, Debt
from .serializers import TransactionSerializer, DebtSerializer

import logging
logger = logging.getLogger(__name__)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-created_at')
    
    def destroy(self, request, *args, **kwargs):
        """Prevent physical deletion of transactions."""
        return Response(
            {"detail": "Физическое удаление транзакций запрещено. Используйте аннулирование (void)."}, 
            status=status.HTTP_403_FORBIDDEN
        )
        
    @action(detail=True, methods=['post'], url_path='void')
    def void_transaction(self, request, pk=None):
        """Marks a transaction as voided."""
        transaction = self.get_object()
        if transaction.void(request.user):
            return Response({"status": "Транзакция успешно аннулирована."})
        return Response({"status": "Транзакция уже была аннулирована."}, status=status.HTTP_400_BAD_REQUEST)
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['transaction_type', 'payment_method', 'patient', 'employee']
    search_fields = ['description', 'patient__first_name', 'patient__last_name']

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Returns financial summary metrics (income, expenses, cash flow)"""
        income = Transaction.objects.filter(transaction_type='INCOME', is_voided=False).aggregate(total=Sum('amount'))['total'] or 0.00
        expense = Transaction.objects.filter(transaction_type='EXPENSE', is_voided=False).aggregate(total=Sum('amount'))['total'] or 0.00
        total_debts = Debt.objects.aggregate(total=Sum('total_amount'))['total'] or 0.00
        total_paid_debts = Debt.objects.aggregate(total=Sum('paid_amount'))['total'] or 0.00
        active_debts = total_debts - total_paid_debts

        return Response({
            "total_income": income,
            "total_expense": expense,
            "net_profit": income - expense,
            "active_debts": active_debts
        })

    @action(detail=True, methods=['get'], url_path='receipt')
    def receipt(self, request, pk=None):
        """Generates a professional PDF receipt for a transaction"""
        transaction = self.get_object()
        
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            import os
            from django.conf import settings
            
            # Register TrueType Font for Cyrillic
            font_path = os.path.join(settings.BASE_DIR, 'DejaVuSans.ttf')
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont('DejaVu', font_path))
                font_name = 'DejaVu'
            else:
                font_name = 'Helvetica'
            
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="receipt_{transaction.id}.pdf"'
            
            doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
            story = []
            
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontName=font_name,
                fontSize=20,
                leading=24,
                textColor=colors.HexColor('#0F172A'),
                spaceAfter=15
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                fontName=font_name,
                fontSize=10,
                leading=14,
                textColor=colors.HexColor('#334155')
            )
            heading2_style = ParagraphStyle(
                'Heading2Style',
                parent=styles['Heading2'],
                fontName=font_name
            )
            
            story.append(Paragraph("PRODENT STOMATOLOGIYA", title_style))
            story.append(Paragraph("Адрес: г. Ташкент, ул. Амира Темура, 45", body_style))
            story.append(Paragraph("Телефон: +998 71 123-45-67", body_style))
            story.append(Spacer(1, 20))
            
            story.append(Paragraph(f"<b>ФИСКАЛЬНЫЙ ЧЕК №{transaction.id}</b>", heading2_style))
            story.append(Paragraph(f"Дата: {transaction.created_at.strftime('%d.%m.%Y %H:%M')}", body_style))
            story.append(Paragraph(f"Тип операции: {transaction.get_transaction_type_display()}", body_style))
            story.append(Paragraph(f"Метод оплаты: {transaction.get_payment_method_display()}", body_style))
            story.append(Spacer(1, 15))
            
            # Receipt table data
            patient_name = str(transaction.patient) if transaction.patient else "—"
            description = transaction.description or "Стоматологические услуги"
            
            data = [
                ["Описание", "Значение"],
                ["Пациент", patient_name],
                ["Назначение платежа", description],
                ["Итого к оплате", f"{transaction.amount:,.2f} UZS"]
            ]
            
            table = Table(data, colWidths=[200, 300])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
                ('FONTNAME', (0,0), (-1,-1), font_name),
                ('FONTSIZE', (0,0), (-1,-1), 10),
            ]))
            story.append(table)
            story.append(Spacer(1, 30))
            
            story.append(Paragraph("Благодарим за визит! Будьте здоровы!", body_style))
            doc.build(story)
            return response
            
        except ImportError:
            # Fallback to HTML printable version if reportlab is not installed
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: sans-serif; padding: 40px; color: #333; }}
                    .header {{ border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }}
                    .title {{ font-size: 24px; font-weight: bold; }}
                    .details {{ margin-bottom: 20px; line-height: 1.6; }}
                    .table {{ width: 100%; border-collapse: collapse; }}
                    .table th, .table td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
                    .table th {{ background-color: #f2f2f2; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">PRODENT STOMATOLOGIYA</div>
                    <div>Адрес: г. Ташкент, ул. Амира Темура, 45 | Тел: +998 71 123-45-67</div>
                </div>
                <h2>ЧЕК ОБ ОПЛАТЕ №{transaction.id}</h2>
                <div class="details">
                    <div><b>Дата:</b> {transaction.created_at.strftime('%d.%m.%Y %H:%M')}</div>
                    <div><b>Тип транзакции:</b> {transaction.get_transaction_type_display()}</div>
                    <div><b>Метод оплаты:</b> {transaction.get_payment_method_display()}</div>
                    <div><b>Пациент:</b> {transaction.patient or '—'}</div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Назначение</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{transaction.description or 'Стоматологические услуги'}</td>
                            <td><b>{transaction.amount:,.2f} UZS</b></td>
                        </tr>
                    </tbody>
                </table>
                <p style="margin-top: 40px; text-align: center;">Спасибо, что доверяете нам свою улыбку!</p>
                <script>window.print();</script>
            </body>
            </html>
            """
            return HttpResponse(html_content)


class DebtViewSet(viewsets.ModelViewSet):
    queryset = Debt.objects.all().order_by('-updated_at')
    serializer_class = DebtSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'status']
