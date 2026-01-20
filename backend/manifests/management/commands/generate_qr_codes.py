"""
Django management command to generate QR codes for lot manifests.

Usage:
    # Generate for all lots
    python manage.py generate_qr_codes --all
    
    # Generate for specific batch
    python manage.py generate_qr_codes --batch BATCH-2024-001
    
    # Specify custom output directory
    python manage.py generate_qr_codes --all --output my_qr_codes/
"""
from django.core.management.base import BaseCommand, CommandError
from manifests.models import LotManifest
from manifests.qr_generator import batch_generate_qr_codes, generate_qr_with_label


class Command(BaseCommand):
    help = 'Generate QR codes for lot manifests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Generate QR codes for all lot manifests',
        )
        parser.add_argument(
            '--batch',
            type=str,
            help='Generate QR code for specific batch number',
        )
        parser.add_argument(
            '--output',
            type=str,
            default='qr_codes',
            help='Output directory for QR codes (default: qr_codes/)',
        )

    def handle(self, *args, **options):
        if options['all']:
            # Generate for all lots
            self.stdout.write('Generating QR codes for all lot manifests...')
            
            queryset = LotManifest.objects.all().select_related('medicine')
            
            if not queryset.exists():
                raise CommandError('No lot manifests found in database')
            
            results = batch_generate_qr_codes(queryset, output_dir=options['output'])
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Generated {len(results)} QR codes in {options["output"]}/'
                )
            )
            
            # List generated files
            for lot, filepath in results[:5]:  # Show first 5
                self.stdout.write(f'  - {filepath}')
            
            if len(results) > 5:
                self.stdout.write(f'  ... and {len(results) - 5} more')
            
        elif options['batch']:
            # Generate for specific batch
            self.stdout.write(f'Generating QR code for batch: {options["batch"]}')
            
            try:
                lot = LotManifest.objects.select_related('medicine').get(
                    batch_number=options['batch']
                )
                
                filepath = f"{options['output']}/{lot.batch_number}.png"
                generate_qr_with_label(lot, save_path=filepath)
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Generated QR code: {filepath}')
                )
                self.stdout.write(f'   Medicine: {lot.medicine.name}')
                self.stdout.write(f'   Batch: {lot.batch_number}')
                
            except LotManifest.DoesNotExist:
                raise CommandError(f'Batch not found: {options["batch"]}')
        else:
            raise CommandError('Please specify --all or --batch <batch_number>')
