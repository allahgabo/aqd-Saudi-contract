"""
Management command to create an admin superuser with admin profile.
Usage: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from contracts.models import UserProfile, Plan


class Command(BaseCommand):
    help = 'Create an admin user and seed plans'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--email',    default='admin@aqd.sa')
        parser.add_argument('--password', default='admin123')

    def handle(self, *args, **options):
        # Seed plans
        plans_data = [
            {'name': 'free',       'display_name': 'Free',       'monthly_limit': 3,   'price_sar': 0,   'features': ['3 analyses/month', 'Basic report', 'Arabic & English']},
            {'name': 'pro',        'display_name': 'Pro',         'monthly_limit': 30,  'price_sar': 99,  'features': ['30 analyses/month', 'PDF report', 'Chat', 'Compare', 'Share']},
            {'name': 'enterprise', 'display_name': 'Enterprise',  'monthly_limit': -1,  'price_sar': 299, 'features': ['Unlimited analyses', 'All Pro features', 'Admin panel', 'API access']},
        ]
        for p in plans_data:
            plan, created = Plan.objects.update_or_create(name=p['name'], defaults=p)
            status = 'created' if created else 'updated'
            self.stdout.write(f"  Plan {plan.display_name} {status}")

        # Create admin user
        username = options['username']
        email    = options['email']
        password = options['password']

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email, 'first_name': 'Admin', 'last_name': 'AQD',
                      'is_staff': True, 'is_superuser': True}
        )
        if created:
            user.set_password(password)
            user.save()

        enterprise_plan = Plan.objects.get(name='enterprise')
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.plan = enterprise_plan
        profile.is_admin = True
        profile.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f"\n{action} admin user:\n"
            f"  Username : {username}\n"
            f"  Password : {password}\n"
            f"  Email    : {email}\n"
            f"  Plan     : Enterprise (unlimited)\n"
            f"  Admin    : Yes\n"
        ))
