# Generated manually for StudentLOAchievement and Assessment.related_los

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_user_created_by_user_is_temporary_password'),
    ]

    operations = [
        # Add related_los field to Assessment
        migrations.AddField(
            model_name='assessment',
            name='related_los',
            field=models.ManyToManyField(
                blank=True,
                help_text='Learning outcomes this assessment evaluates',
                related_name='assessments',
                to='api.learningoutcome'
            ),
        ),
        
        # Create StudentLOAchievement model
        migrations.CreateModel(
            name='StudentLOAchievement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_percentage', models.DecimalField(
                    decimal_places=2,
                    help_text='Current achievement percentage',
                    max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100)
                    ]
                )),
                ('total_assessments', models.IntegerField(
                    default=0,
                    help_text='Total number of assessments for this LO'
                )),
                ('completed_assessments', models.IntegerField(
                    default=0,
                    help_text='Number of completed assessments'
                )),
                ('last_calculated', models.DateTimeField(
                    auto_now=True,
                    help_text='When this achievement was last calculated'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('learning_outcome', models.ForeignKey(
                    help_text='Learning Outcome',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='student_achievements',
                    to='api.learningoutcome'
                )),
                ('student', models.ForeignKey(
                    help_text='Student',
                    limit_choices_to={'role': 'STUDENT'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lo_achievements',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Student LO Achievement',
                'verbose_name_plural': 'Student LO Achievements',
                'db_table': 'student_lo_achievements',
                'unique_together': {('student', 'learning_outcome')},
                'ordering': ['student', 'learning_outcome'],
            },
        ),
    ]

