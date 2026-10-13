from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0006_smslog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='language',
            field=models.CharField(choices=[('ru', 'Русский'), ('uz', "O'zbek")], default='uz', max_length=2),
        ),
    ]
