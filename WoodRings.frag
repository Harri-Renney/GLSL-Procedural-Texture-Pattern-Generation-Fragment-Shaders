#version 330 core

////////////
// Inputs //
////////////
in vec2 TexCoord;

/////////////
// Outputs //
/////////////
out vec4 colour;

//////////////
// Uniforms //
//////////////

/////////////////////////////////////////////////////////////////////
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

///////////////////////////////////////////////////////////////////////

// Used to map a value of one input range to its equivalent in another output range.
float mapToRange(float inputValue, float inputStart, float inputEnd, float outputStart, float outputEnd)
{
  return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (inputValue - inputStart);
}

// Used to convert 0-255 rgb to 0.0-1.0 rgb.
float rgbToGLSL(float colour)
{
  return colour / 255.0;
}

// Simplex noise with inputs of Texture Coordinates with detail specified by size.
float snoiseTurbulence(float x, float y, float initialSize)
{
	float t = 0.0;
	float size = initialSize;

	while (size >= 1)
	{
		t += snoise(vec2(TexCoord.x*255 / size, TexCoord.y*255 / size)) * size;
		size /= 2;
	}

	t = (t) / initialSize;
	return t;
}

//The basic function to form rings using Texture Coordinates.
float rings(float x, float y, int numberOfCircles)
{
  float ret;
  //Maps x and z to include the negative range so creates whole circles rather than quarters
  float xx = x - 0.5;
  float yy = y - 0.5;

  ret = sin(numberOfCircles*2 * sqrt(xx*xx*40 + yy*yy*40));
  return ret;
}

//Function to form log cross-section using Texture Coordinates with variable turbulence.
vec3 woodRings(float x, float y, int numberOfCircles, float turbPower, float turbSize)
{
  vec3 retColour;

  //Maps x and z to include the negative range so creates whole circles rather than quarters
  float xx = x - 0.5;
  float yy = y - 0.5;

  //Form wood rings by combining rings + turbulence(noise) then putting through sin function.
  float rings = numberOfCircles * sqrt(xx*xx*40 + yy*yy*40);
  float turbulence = turbPower * snoiseTurbulence(TexCoord.x, TexCoord.y, turbSize);
  float turbulenceRings = rings+turbulence;
  float formedRings = abs(sin(turbulenceRings));
  formedRings = mapToRange(formedRings, 0.0, 1.0, 0.0, 0.3);

  //Colour set using formed rings value but added to rgb constants for wood colour.
  retColour = vec3(rgbToGLSL(80.0) + formedRings, rgbToGLSL(30.0) + formedRings, rgbToGLSL(0.0));
  return retColour;
}

void main ()
{
  ///////////////////////////
  // generate Pixel Colour //
  ///////////////////////////
	//float t = snoise(vec2(TexCoord.x*2, TexCoord.y*2));
	//float t = snoiseTurbulence(TexCoord.x, TexCoord.y, 1208);
  //float t = rings(TexCoord.x, TexCoord.y, 7);
  vec3 c = woodRings(TexCoord.x, TexCoord.y, 12, 0.6, 32);

  //////////////////
	// Output pixel //
  //////////////////
  //colour = vec4(t,t,t, 1.0);
  colour = vec4(c, 1.0);
}
