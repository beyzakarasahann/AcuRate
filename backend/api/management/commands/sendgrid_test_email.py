from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Send a test email using the configured SendGrid backend."

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            required=True,
            help="Recipient email address for the test message.",
        )
        parser.add_argument(
            "--subject",
            default="AcuRate SendGrid Test Email",
            help="Subject line for the test email.",
        )
        parser.add_argument(
            "--message",
            default="This is a SendGrid test email from AcuRate.",
            help="Body text for the test email.",
        )

    def handle(self, *args, **options):
        if not settings.SENDGRID_API_KEY:
            raise CommandError(
                "SENDGRID_API_KEY is not configured. Please set it in backend/.env."
            )

        recipient = options["to"]
        subject = options["subject"]
        message = options["message"]

        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )

        if sent == 0:
            raise CommandError("Django did not report any emails being sent.")

        self.stdout.write(
            self.style.SUCCESS(
                f"Test email queued successfully to {recipient} via SendGrid."
            )
        )


