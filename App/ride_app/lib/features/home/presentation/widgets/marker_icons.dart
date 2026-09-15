import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Renders a small circular bitmap with a letter on it (e.g. "C" for
/// current location, "D" for destination) so the two map pins are
/// visually distinct instead of being two plain colored dots.
class MarkerIcons {
  static Future<Uint8List> buildLabeledMarker({
    required String label,
    required Color backgroundColor,
    double size = 96,
  }) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final radius = size / 2;

    final fillPaint = Paint()..color = backgroundColor;
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size * 0.08;

    canvas.drawCircle(Offset(radius, radius), radius - 4, fillPaint);
    canvas.drawCircle(Offset(radius, radius), radius - 4, borderPaint);

    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.42,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(radius - textPainter.width / 2, radius - textPainter.height / 2),
    );

    final picture = recorder.endRecording();
    final image = await picture.toImage(size.toInt(), size.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }
}