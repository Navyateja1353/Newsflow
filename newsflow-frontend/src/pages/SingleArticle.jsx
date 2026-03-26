import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function SingleArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
      const element = document.getElementById('article-print-container');
      if (!element) return;
      
      setPdfLoading(true);
      try {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          const pdfWidth = 210;
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;
          
          const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${article.headline.substring(0, 30)}.pdf`);
      } catch (err) {
          console.error("PDF generation failed", err);
          alert("Failed to generate PDF.");
      } finally {
          setPdfLoading(false);
      }
  };

  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    axios.get("http://localhost:3000/api/settings/logo")
      .then(res => {
          if (res.data && res.data.value && res.data.value !== 'null') {
              setLogoUrl(res.data.value);
          }
      }).catch(err => console.error(err));

    axios.get(`http://localhost:3000/api/public/article/${id}`)
      .then(res => {
        setArticle(res.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{textAlign: "center", padding: "50px", fontFamily: "sans-serif"}}>లోడ్ అవుతోంది...</div>;
  if (!article) return <div style={{textAlign: "center", padding: "50px", fontFamily: "sans-serif"}}>వార్త కనుగొనబడలేదు (Article Not Found)</div>;

  const logoSrc = logoUrl && logoUrl !== 'null' ? (logoUrl.startsWith('http') ? logoUrl : (logoUrl.startsWith('/logos/') ? logoUrl : `http://localhost:3000${logoUrl}`)) : null;
  const imageSrc = article.image_url ? (article.image_url.startsWith('http') ? article.image_url : `http://localhost:3000${article.image_url}`) : null;

  // Derive newspaper name from logo path
  const getNewspaperName = (url) => {
      if (!url || url === 'null') return "RTI Express";
      if (url.includes('bharath')) return "Bharath Reporter";
      if (url.includes('janam')) return "Janam News";
      if (url.includes('national')) return "National News Reporter";
      if (url.includes('rti')) return "RTI Express";
      return "RTI Express";
  };
  const newspaperName = getNewspaperName(logoUrl);

  // Split content naturally into highlights and body
  const allParagraphs = article.content.split('\n').filter(p => p.trim() !== '');
  let highlights = [];
  let mainText = [];

  if (allParagraphs.length === 1) {
      // If there's only one block of text, try splitting by sentence (period space) for a highlight
      const sentences = allParagraphs[0].split('. ');
      if (sentences.length > 2) {
          highlights = [sentences[0] + '.'];
          mainText = [sentences.slice(1).join('. ')];
      } else {
          mainText = allParagraphs;
      }
  } else if (allParagraphs.length > 1) {
      highlights = [allParagraphs[0]]; // Use first paragraph as the main highlight
      mainText = allParagraphs.slice(1);
  }

  return (
    <div style={{ backgroundColor: "#f4f4f4", minHeight: "100vh", padding: "20px 10px" }}>
        {/* Print Action Bar */}
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "15px", textAlign: "right" }}>
            <button 
                onClick={handleDownloadPDF} 
                disabled={pdfLoading}
                style={{ 
                    backgroundColor: "#9333ea", // Purple download button 
                    color: "#fff", 
                    border: "none", 
                    padding: "10px 20px", 
                    borderRadius: "5px", 
                    cursor: "pointer", 
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    opacity: pdfLoading ? 0.7 : 1
                }}
            >
                {pdfLoading ? "Generating PDF..." : "🖨️ Download PDF"}
            </button>
        </div>

        <div id="article-print-container" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.1)", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            
            {/* Logo Section */}
            <div style={{ textAlign: "center", padding: "0" }}>
                {logoSrc ? (
                    <img src={logoSrc} alt="Newspaper Logo" style={{ width: "100%", height: "auto", display: "block" }} />
                ) : (
                    <div style={{ border: "2px solid #8B008B", padding: "15px", backgroundColor: "#fff" }}>
                        <span style={{ fontSize: "52px", fontWeight: "900", color: "#8B008B", letterSpacing: "1px", textTransform: "uppercase" }}>{newspaperName}</span>
                    </div>
                )}
            </div>

            {/* Date & Reporters Text */}
            <div style={{ 
                textAlign: "center", 
                padding: "15px 0", 
                fontSize: "14px", 
                fontWeight: "600", 
                color: "#222", 
                borderBottom: "1px solid #ddd", 
                marginBottom: "20px" 
            }}>
                <span style={{ display: 'block', marginBottom: '5px' }}>{newspaperName} - {todayString}</span>
                <span style={{ display: 'block' }}>Wanted Reporters:7668886666</span>
            </div>

            {/* Red Headline Area */}
            <div style={{ padding: "0 20px 20px", textAlign: "center" }}>
                <h1 style={{ 
                    color: "#e60000", 
                    fontSize: "46px", 
                    fontWeight: "900", 
                    margin: "0 0 25px 0", 
                    lineHeight: "1.2", 
                    textShadow: "1px 1px 0 #fff" 
                }}>
                    {article.headline}
                </h1>
            </div>

            {/* Hero Section & Main Matter Wrapper */}
            <div style={{ padding: "0 20px", paddingBottom: "40px" }}>
                
                {/* 
                   We float the image to the right so that text on the left wraps gracefully 
                   around it and flows seamlessly underneath it.
                */}
                {imageSrc && (
                    <div style={{ 
                        float: 'right', 
                        width: '55%', 
                        marginLeft: '25px', 
                        marginBottom: '15px' 
                    }}>
                        <div style={{ 
                            width: '100%', 
                            border: '1px solid #c0c0c0', 
                            padding: '4px', 
                            backgroundColor: '#fff', 
                            boxShadow: '0 3px 8px rgba(0,0,0,0.1)' 
                        }}>
                            <img src={imageSrc} style={{ width: "100%", height: "auto", display: "block" }} alt="Article Visual" />
                        </div>
                    </div>
                )}

                {/* Left Highlights with Red Stars */}
                <div>
                    {highlights.map((p, i) => (
                        <div key={'h'+i} style={{ position: 'relative', paddingLeft: '32px', marginBottom: '18px' }}>
                            <span style={{ position: 'absolute', left: '0', top: '-1px', color: '#e60000', fontSize: '26px' }}>★</span>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '15.5px', lineHeight: '1.6', color: '#111', textAlign: "justify" }}>
                                {p}
                            </p>
                        </div>
                    ))}
                    
                    {/* Main Paragraphs Area - text flows naturally under image */}
                    <div style={{ 
                        fontSize: "16.5px", 
                        lineHeight: "1.8", 
                        color: "#222", 
                        textAlign: "justify",
                        paddingTop: highlights.length > 0 ? "5px" : "0"
                    }}>
                        {mainText.map((p, i) => (
                            <p key={'m'+i} style={{ marginBottom: "18px", whiteSpace: "pre-wrap" }}>
                                {p}
                            </p>
                        ))}
                    </div>
                </div>
                
                {/* Clear the float so the container wraps perfectly if text is short */}
                <div style={{ clear: 'both' }}></div>
            </div>

            {/* Bottom Color Accent */}
            <div style={{ height: "10px", backgroundColor: "#00a650", width: "100%" }}></div>

        </div>
    </div>
  );
}

export default SingleArticle;
