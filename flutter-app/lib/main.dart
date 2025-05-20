import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'di/injection.dart';
import 'presentation/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize environment variables
  await dotenv.load(fileName: '.env');
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // TODO: Register Hive adapters when models are finalized
  // await Hive.registerAdapter(UserModelAdapter());
  
  // Initialize dependency injection
  await initDependencies();
  
  runApp(const RisingBSMApp());
}
