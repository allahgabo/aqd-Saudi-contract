from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


def populate_share_tokens(apps, schema_editor):
    """Give every existing contract a unique share_token."""
    Contract = apps.get_model('contracts', 'Contract')
    for contract in Contract.objects.all():
        contract.share_token = uuid.uuid4()
        contract.save(update_fields=['share_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('contracts', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        # ── Plan model ──────────────────────────────────────────────
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(
                    choices=[('free','Free'),('pro','Pro'),('enterprise','Enterprise')],
                    max_length=20, unique=True)),
                ('display_name', models.CharField(max_length=50)),
                ('monthly_limit', models.IntegerField(default=3)),
                ('price_sar', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('features', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),

        # ── is_shared: simple boolean, safe to add with default ─────
        migrations.AddField(
            model_name='contract',
            name='is_shared',
            field=models.BooleanField(default=False),
        ),

        # ── share_token step 1: add WITHOUT unique constraint ────────
        migrations.AddField(
            model_name='contract',
            name='share_token',
            field=models.UUIDField(default=uuid.uuid4, unique=False),
        ),

        # ── share_token step 2: fill each row with a distinct UUID ───
        migrations.RunPython(populate_share_tokens, migrations.RunPython.noop),

        # ── share_token step 3: now apply the unique constraint ──────
        migrations.AlterField(
            model_name='contract',
            name='share_token',
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),

        # ── Clause category choices update ──────────────────────────
        migrations.AlterField(
            model_name='clauseanalysis',
            name='category',
            field=models.CharField(choices=[
                ('parties','Contract Parties'),('job_title','Job Title'),('workplace','Workplace'),
                ('salary','Salary & Allowances'),('duration','Contract Duration'),('probation','Probation Period'),
                ('working_hours','Working Hours'),('vacation','Vacation & Leave'),('overtime','Overtime'),
                ('termination','Contract Termination'),('compensation','End of Service'),
                ('confidentiality','Confidentiality'),('non_compete','Non-Competition'),
                ('deductions','Deductions & Penalties'),('transfer','Employee Transfer'),
                ('medical_insurance','Medical Insurance'),('renewal','Contract Renewal'),
                ('start_date','Start Date'),('other','Other'),
            ], max_length=50),
        ),

        migrations.AlterField(
            model_name='missingclause',
            name='importance',
            field=models.CharField(choices=[
                ('required','Required by Law'),('recommended','Recommended'),('optional','Optional'),
            ], max_length=20),
        ),

        # ── UserProfile model ────────────────────────────────────────
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company', models.CharField(blank=True, max_length=255)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('avatar_color', models.CharField(default='#3B82F6', max_length=7)),
                ('is_admin', models.BooleanField(default=False)),
                ('contracts_this_month', models.IntegerField(default=0)),
                ('month_reset_date', models.DateField(default=django.utils.timezone.now)),
                ('total_contracts', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('plan', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='contracts.plan')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to='auth.user')),
            ],
        ),
    ]
