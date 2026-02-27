const handleSendMessage = async () => {
  if (!inputMessage.trim()) return;

  const userMessage = {
    id: messages.length + 1,
    text: inputMessage,
    sender: 'user'
  };

  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsLoading(true);

  try {
    console.log('Sending message:', inputMessage);
    console.log('API URL:', 'http://localhost:5000/api/chat'); // Updated debug log

    const cropContext = `
      Crop: ${crop.name}
      Season: ${crop.season}
      Soil Type: ${crop.soil}
      Temperature: ${crop.temp}
      Water Requirement: ${crop.water}
      Duration: ${crop.duration}
      Fertilizer: ${crop.fertilizer}
      Expected Yield: ${crop.yield}
    `;

    // HARDCODED URL FOR TESTING
    const response = await fetch(`http://localhost:5000/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: inputMessage,
        cropContext: cropContext
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    const botMessage = {
      id: messages.length + 2,
      text: data.reply,
      sender: 'bot'
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    console.error('Detailed error:', error);
    
    const errorMessage = {
      id: messages.length + 2,
      text: `Error: ${error.message}. Please check if the server is running at http://localhost:5000`,
      sender: 'bot'
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ========== PDF DOWNLOAD FUNCTION ==========
  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    const element = pdfContentRef.current;
    
    // Temporarily remove animation classes for PDF generation
    const stagesContainer = stagesContainerRef.current;
    if (stagesContainer) {
      stagesContainer.classList.add('pdf-generation-mode');
    }
    
    // Optimized PDF options
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${crop.name.replace(/\s+/g, '_')}_Cultivation_Guide.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        letterRendering: true,
        useCORS: true,
        logging: false,
        allowTaint: false,
        foreignObjectRendering: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Show loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'pdf-loading';
    loadingMsg.innerHTML = '📄 Generating PDF... Please wait.';
    document.body.appendChild(loadingMsg);

    try {
      // Force reflow to ensure all content is rendered
      element.style.display = 'block';
      
      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate and save PDF
      await html2pdf().set(opt).from(element).save();
      
      // Success message
      loadingMsg.innerHTML = '✅ PDF generated successfully!';
      setTimeout(() => {
        document.body.removeChild(loadingMsg);
      }, 1500);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      loadingMsg.innerHTML = '❌ Error generating PDF. Please try again.';
      setTimeout(() => {
        document.body.removeChild(loadingMsg);
      }, 2000);
    } finally {
      // Restore animation classes
      if (stagesContainer) {
        stagesContainer.classList.remove('pdf-generation-mode');
      }
      setIsGeneratingPDF(false);
    }
  };

  // ========== RENDER FUNCTIONS ==========
  
  /**
   * Renders all growing stages in a vertical list - PDF FRIENDLY VERSION
   * No animations, no complex CSS transforms
   */
  const renderAllStages = () => {
    if (crop.description && typeof crop.description === 'object' && !Array.isArray(crop.description)) {
      const stages = Object.keys(crop.description);
      
      return (
        <div className="all-stages-container" ref={stagesContainerRef}>
          {stages.map((stageKey, index) => {
            // Format stage name for display
            const formatStageName = (name) => {
              return name
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace(/\b\w/g, char => char.toUpperCase());
            };

            return (
              <div key={stageKey} className="stage-full-card pdf-friendly">
                <div className="stage-full-header">
                  <div className="stage-icon-wrapper">
                    <span className="stage-number-badge">{index + 1}</span>
                  </div>
                  <h3 className="stage-full-title">
                    Stage {index + 1}: {formatStageName(stageKey)}
                  </h3>
                </div>
                <div className="stage-full-content">
                  <p className="stage-full-description">
                    {crop.description[stageKey]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (typeof crop.description === 'string') {
      return <p className="crop-detail-description">{crop.description}</p>;
    }
    return <p className="crop-detail-description">No description available</p>;
  };

  const renderTitleDescription = () => {
    if (crop.titleDescription) {
      return (
        <div className="title-description">
          <p>{crop.titleDescription}</p>
        </div>
      );
    }
    return null;
  };

  // ========== MAIN RENDER ==========
  return (
    <div className={`crop-details-page ${isGeneratingPDF ? 'is-generating-pdf' : ''}`}>
      <div className="crop-details-container">
        
        {/* ===== HEADER ACTIONS ===== */}
        <div className="header-actions">
          <button onClick={() => navigate(-1)} className="back-btn" disabled={isGeneratingPDF}>
            <FaArrowLeft /> Back to Crops
          </button>
          <button 
            onClick={downloadPDF} 
            className="download-pdf-btn"
            disabled={isGeneratingPDF}
          >
            <FaFilePdf /> <FaDownload /> {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Guide'}
          </button>
        </div>

        {/* ===== MAIN CARD ===== */}
        <div className="crop-details-card" ref={pdfContentRef}>
          
          {/* Crop Image Section */}
          <div 
            className="crop-detail-image"
            style={{ backgroundImage: `url(${crop.image})` }}
          >
            <div className="crop-detail-overlay">
              <h1 className="crop-detail-title">{crop.name}</h1>
            </div>
          </div>

          {/* Crop Content Section */}
          <div className="crop-detail-content">
            
            {/* Title Description */}
            {renderTitleDescription()}

            {/* Growing Stages Section - ALL STAGES VERTICAL */}
            <div className="crop-detail-section">
              <h2 className="section-title">
                <FaListAlt className="section-icon" />
                Complete Growing Guide
              </h2>
              {renderAllStages()}
            </div>

            {/* Growing Requirements Section */}
            <div className="crop-detail-section">
              <h2 className="section-title">Growing Requirements</h2>
              <div className="info-grid">
                
                <div className="info-item">
                  <FaTemperatureHigh className="info-icon" />
                  <div className="info-content">
                    <h4>Temperature</h4>
                    <p>{crop.temp}</p>
                  </div>
                </div>

                <div className="info-item">
                  <FaTint className="info-icon" />
                  <div className="info-content">
                    <h4>Water Requirement</h4>
                    <p>{crop.water}</p>
                  </div>
                </div>

                <div className="info-item">
                  <FaClock className="info-icon" />
                  <div className="info-content">
                    <h4>Growing Duration</h4>
                    <p>{crop.duration}</p>
                  </div>
                </div>

                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div className="info-content">
                    <h4>Soil Type</h4>
                    <p>{crop.soil}</p>
                  </div>
                </div>

                {/* <div className="info-item">
                  <FaFlask className="info-icon" />
                  <div className="info-content">
                    <h4>Fertilizer</h4>
                    <p>{crop.fertilizer}</p>
                  </div>
                </div> */}

                <div className="info-item">
                  <FaWeightHanging className="info-icon" />
                  <div className="info-content">
                    <h4>Expected Yield</h4>
                    <p>{crop.yield}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growing Tips Section */}
            <div className="crop-detail-section">
              <h2 className="section-title">Growing Tips</h2>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-number">1</span>
                  <p>Prepare the soil with proper tillage and add recommended organic manures</p>
                </div>
                <div className="tip-item">
                  <span className="tip-number">2</span>
                  <p>Maintain proper irrigation schedule based on critical growth stages</p>
                </div>
                <div className="tip-item">
                  <span className="tip-number">3</span>
                  <p>Monitor for pests and diseases regularly; use organic control methods</p>
                </div>
                <div className="tip-item">
                  <span className="tip-number">4</span>
                  <p>Harvest at the right maturity stage for maximum yield and quality</p>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="crop-detail-section">
              <h2 className="section-title">Additional Information</h2>
              <div className="additional-info">
                <p><strong>Sowing Time:</strong> {crop.season === 'kharif' ? 'June-July (with monsoon onset)' : 'October-November (after monsoon)'}</p>
                <p><strong>Harvesting Time:</strong> {crop.season === 'kharif' ? 'September-October' : 'March-April'}</p>
                <p><strong>Crop Season:</strong> {crop.season === 'kharif' ? 'Kharif (Monsoon)' : 'Rabi (Winter)'}</p>
                <p><strong>Crop ID:</strong> {crop.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHATBOT FLOATING BUTTON ===== */}
      {!isGeneratingPDF && (
        <button 
          className={`chatbot-toggle-btn ${isChatOpen ? 'open' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          {isChatOpen ? <FaTimes /> : <FaRobot />}
        </button>
      )}

      {/* ===== CHATBOT WINDOW ===== */}
      {isChatOpen && !isGeneratingPDF && (
        <div className="chatbot-window">
          
          {/* Chatbot Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <FaRobot className="chatbot-icon" />
              <h3>Farming Assistant</h3>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="chatbot-close">
              <FaTimes />
            </button>
          </div>

          {/* Chatbot Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {renderMessage(msg)}
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <p>Typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chatbot Input Area */}
          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about farming practices, pests, diseases, etc..."
              rows="1"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="send-btn"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropDetails;