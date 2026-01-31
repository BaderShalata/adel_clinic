import 'package:flutter/material.dart';
import '../models/news.dart';
import '../services/api_service.dart';

class NewsProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<News> _news = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<News> get news => _news;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadNews() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _news = await _apiService.getPublishedNews();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
